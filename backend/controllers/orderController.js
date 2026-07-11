const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { BASE_CURRENCY, normalizeCurrency, convertPrice } = require('../services/currencyService');

const transformOrderForCurrency = async (orderDoc, targetCurrency) => {
  const order = orderDoc.toObject();

  order.orderItems = await Promise.all(
    order.orderItems.map(async (item) => {
      const originalPrice = typeof item.originalPrice === 'number' ? item.originalPrice : item.price;
      const convertedPrice = await convertPrice(originalPrice, targetCurrency);
      return {
        ...item,
        originalPrice,
        convertedPrice,
        currencyUsed: targetCurrency,
        price: convertedPrice,
      };
    })
  );

  const originalTotal = typeof order.originalPrice === 'number' ? order.originalPrice : order.totalPrice;
  const convertedTotal = await convertPrice(originalTotal, targetCurrency);

  order.originalPrice = originalTotal;
  order.convertedPrice = convertedTotal;
  order.currencyUsed = targetCurrency;
  order.totalPrice = convertedTotal;

  return order;
};

// Create Order - CRITICAL: Coordinates entire transaction
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, currency } = req.body;
    const currencyUsed = normalizeCurrency(currency || BASE_CURRENCY);
    
    // Validate shipping address
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
      return res.status(400).json({ success: false, message: 'Shipping address required' });
    }
    
    if (!paymentMethod || !['COD', 'ONLINE', 'UPI', 'PAYPAL'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Valid payment method required' });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const invalidItems = cart.items.filter((item) => !item?.product || !item?.product?._id);
    if (invalidItems.length > 0) {
      cart.items = cart.items.filter((item) => item?.product && item?.product?._id);
      await cart.save();
    }

    if (!cart.items.length) {
      return res.status(400).json({
        success: false,
        message: 'Your cart has invalid/unavailable items. Please refresh cart and add products again.',
      });
    }

    // Verify stock and prepare order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const productId = item?.product?._id || item?.product;
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'A cart item is invalid. Please refresh cart and try again.',
        });
      }

      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item?.product?.title || item?.title || 'item'} not found`,
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.title}. Available: ${product.stock}`
        });
      }

      const unitPrice = Number(item.priceAtPurchase ?? item.price ?? product.price ?? 0);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${product.title}. Please refresh cart and try again.`,
        });
      }

      // Add to order items
      orderItems.push({
        product: productId,
        title: item?.product?.title || item?.title || product.title,
        price: unitPrice,
        originalPrice: unitPrice,
        convertedPrice: await convertPrice(unitPrice, currencyUsed),
        currencyUsed,
        quantity: item.quantity,
        image: item?.product?.image || item?.image
      });

      subtotal += unitPrice * item.quantity;
    }

    for (const item of orderItems) {
      const stockUpdate = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      if (!stockUpdate.modifiedCount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.title}. Please refresh cart and try again.`,
        });
      }
    }

    // Calculate order totals
    const shipping = subtotal > 500 ? 0 : 50;
    const tax = Math.round(subtotal * 0.18);
    const totalPrice = subtotal + shipping + tax;
    const convertedTotalPrice = await convertPrice(totalPrice, currencyUsed);

    // Create order
    const order = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending',
      orderStatus: 'processing',
      subtotal,
      shipping,
      tax,
      totalPrice,
      originalPrice: totalPrice,
      convertedPrice: convertedTotalPrice,
      currencyUsed,
    });

    await order.save();

    // Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    // Return order with ID for redirect
    res.json({ 
      success: true, 
      message: 'Order created successfully',
      order: {
        _id: order._id,
        orderItems,
        shippingAddress,
        totalPrice,
        originalPrice: totalPrice,
        convertedPrice: convertedTotalPrice,
        currencyUsed,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get my orders
exports.getMyOrders = async (req, res) => {
  try {
    const targetCurrency = normalizeCurrency(req.query.currency || BASE_CURRENCY);
    const orders = await Order.find({ user: req.user.id })
      .populate('orderItems.product', 'title image')
      .sort({ createdAt: -1 });

    const transformedOrders = await Promise.all(
      orders.map((order) => transformOrderForCurrency(order, targetCurrency))
    );

    res.json({ success: true, orders: transformedOrders, currency: targetCurrency });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const targetCurrency = normalizeCurrency(req.query.currency || BASE_CURRENCY);
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('orderItems.product', 'title image')
      .sort({ createdAt: -1 });

    const transformedOrders = await Promise.all(
      orders.map((order) => transformOrderForCurrency(order, targetCurrency))
    );

    res.json({ success: true, orders: transformedOrders, currency: targetCurrency });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const targetCurrency = normalizeCurrency(req.query.currency || BASE_CURRENCY);
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('orderItems.product', 'title image price');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user is owner or admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const transformedOrder = await transformOrderForCurrency(order, targetCurrency);
    res.json({ success: true, order: transformedOrder, currency: targetCurrency });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'confirmed', 'dispatched', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        orderStatus: status,
        deliveredAt: status === 'delivered' ? new Date() : order.deliveredAt,
        cancelledAt: status === 'cancelled' ? new Date() : order.cancelledAt
      },
      { new: true }
    );

    res.json({ success: true, message: 'Order status updated', order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update payment status (for payment gateway integration)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const validPaymentStatuses = ['pending', 'paid', 'failed'];
    
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const order = await Order.findById(req.params.id);

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        paymentStatus: paymentStatus,
        paidAt: paymentStatus === 'paid' ? new Date() : order.paidAt
      },
      { new: true }
    );

    res.json({ success: true, message: 'Payment status updated', order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
