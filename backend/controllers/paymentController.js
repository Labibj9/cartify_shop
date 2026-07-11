const crypto = require('crypto');
const Razorpay = require('razorpay');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const hasPlaceholderKeys =
    String(keyId || '').includes('rzp_test_key') ||
    String(keySecret || '').includes('rzp_test_secret');

  if (!keyId || !keySecret || hasPlaceholderKeys) {
    throw new Error('Razorpay credentials are missing/invalid. Set real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const hasValidRazorpayCredentials = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const hasPlaceholderKeys =
    String(keyId || '').includes('rzp_test_key') ||
    String(keySecret || '').includes('rzp_test_secret');

  return !!keyId && !!keySecret && !hasPlaceholderKeys;
};

const buildPendingOrderFromCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  const invalidItems = cart.items.filter((item) => !item?.product || !item?.product?._id);
  if (invalidItems.length > 0) {
    cart.items = cart.items.filter((item) => item?.product && item?.product?._id);
    await cart.save();
  }

  if (!cart.items.length) {
    throw new Error('Your cart has invalid/unavailable items. Please refresh cart and add products again.');
  }

  const orderItems = [];
  let subtotalINR = 0;

  for (const item of cart.items) {
    const productId = item?.product?._id || item?.product;
    if (!productId) {
      throw new Error('A cart item is invalid. Please refresh cart and try again.');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product ${item?.product?.title || item?.title || 'item'} no longer exists. Remove it from cart and try again.`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.title}. Available: ${product.stock}`);
    }

    const unitPriceINR = Number(item.priceAtPurchase || product.price || 0);

    orderItems.push({
      product: productId,
      title: item?.product?.title || item?.title || product.title,
      price: unitPriceINR,
      originalPrice: unitPriceINR,
      convertedPrice: unitPriceINR,
      currencyUsed: 'INR',
      quantity: item.quantity,
      image: item?.product?.image || item?.image,
    });

    subtotalINR += unitPriceINR * item.quantity;
  }

  const shippingINR = subtotalINR > 500 ? 0 : 50;
  const taxINR = Math.round(subtotalINR * 0.18);
  const totalINR = subtotalINR + shippingINR + taxINR;

  return {
    orderItems,
    subtotalINR,
    shippingINR,
    taxINR,
    totalINR,
  };
};

exports.createUpiOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    const {
      orderItems,
      subtotalINR,
      shippingINR,
      taxINR,
      totalINR,
    } = await buildPendingOrderFromCart(req.user.id);

    const localOrder = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod: 'UPI',
      paymentStatus: 'pending',
      orderStatus: 'processing',
      subtotal: subtotalINR,
      shipping: shippingINR,
      tax: taxINR,
      totalPrice: totalINR,
      originalPrice: totalINR,
      convertedPrice: totalINR,
      currencyUsed: 'INR',
      paymentResult: {
        provider: 'razorpay',
      },
    });

    await localOrder.save();

    if (!hasValidRazorpayCredentials() && process.env.NODE_ENV !== 'production') {
      return res.json({
        success: true,
        mock: true,
        message: 'Razorpay keys are not configured. Running UPI in local mock mode.',
        localOrderId: localOrder._id,
      });
    }

    const razorpay = getRazorpayClient();
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalINR * 100),
      currency: 'INR',
      receipt: `order_${localOrder._id}`,
      notes: {
        localOrderId: localOrder._id.toString(),
      },
    });

    localOrder.paymentResult = {
      ...(localOrder.paymentResult || {}),
      provider: 'razorpay',
      captureId: razorpayOrder.id,
      status: razorpayOrder.status,
      amount: totalINR,
      currency: 'INR',
      raw: razorpayOrder,
    };
    await localOrder.save();

    return res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
      localOrderId: localOrder._id,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyUpiPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      localOrderId,
      mock,
    } = req.body;

    if (!localOrderId) {
      return res.status(400).json({ success: false, message: 'localOrderId is required' });
    }

    if (!mock) {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Missing Razorpay verification fields' });
      }

      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid Razorpay signature' });
      }
    }

    const localOrder = await Order.findOne({ _id: localOrderId, user: req.user.id });
    if (!localOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (localOrder.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Order already paid', order: localOrder });
    }

    for (const item of localOrder.orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.title} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}. Available: ${product.stock}`,
        });
      }
    }

    for (const item of localOrder.orderItems) {
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

    localOrder.paymentStatus = 'paid';
    localOrder.paidAt = new Date();
    localOrder.paymentResult = {
      provider: mock ? 'upi-mock' : 'razorpay',
      paypalOrderId: null,
      captureId: mock ? `MOCK_UPI_${Date.now()}` : razorpay_payment_id,
      status: mock ? 'mock_captured' : 'captured',
      payerEmail: null,
      amount: Number(localOrder.totalPrice || 0),
      currency: 'INR',
      raw: {
        razorpay_order_id,
        razorpay_payment_id,
        mock: !!mock,
      },
    };

    await localOrder.save();

    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();
    }

    return res.json({
      success: true,
      message: 'UPI payment verified and order completed',
      order: {
        _id: localOrder._id,
        paymentStatus: localOrder.paymentStatus,
        orderStatus: localOrder.orderStatus,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Create mock payment order
exports.createPaymentOrder = async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and Order ID required' });
    }

    // Generate mock payment ID
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock payment order response (Razorpay-like structure)
    const paymentOrder = {
      id: paymentId,
      entity: 'payment',
      amount: amount * 100, // In paise
      currency: 'USD',
      status: 'created',
      receipt: orderId,
      createdAt: new Date()
    };

    res.json({ 
      success: true, 
      message: 'Payment order created',
      payment: paymentOrder
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Verify mock payment
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, amount, simulate } = req.body;

    if (!paymentId || !amount) {
      return res.status(400).json({ success: false, message: 'Payment ID and amount required' });
    }

    // Simulate payment: 80% success rate based on random or explicit simulate param
    const isSuccess = simulate !== undefined ? simulate : Math.random() < 0.8;

    if (isSuccess) {
      const verifiedPayment = {
        id: paymentId,
        status: 'captured',
        amount: amount * 100,
        currency: 'USD',
        method: 'card',
        vpa: 'test@upi',
        acquirer_data: { auth_code: 'AUTH_' + Date.now() },
        created_at: Math.floor(Date.now() / 1000)
      };

      return res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        payment: verifiedPayment
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed - Invalid payment ID or expired',
        payment: null
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Process payment with simulation
// simulate: true = success, false = failure
exports.processPayment = async (req, res) => {
  try {
    const { amount, orderId, simulate } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and Order ID required' });
    }

    // Determine payment result
    const isSuccess = simulate !== undefined ? simulate : Math.random() < 0.8;

    if (isSuccess) {
      const paymentResult = {
        status: 'success',
        paymentId: `PAY_${Date.now()}`,
        orderId: orderId,
        amount: amount,
        timestamp: new Date(),
        method: 'ONLINE'
      };

      return res.json({ 
        success: true, 
        message: 'Payment processed successfully',
        result: paymentResult
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment processing failed. Please try again or use COD.',
        result: null
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'Payment ID required' });
    }

    // Mock payment status response
    const paymentStatus = {
      id: paymentId,
      status: Math.random() < 0.9 ? 'captured' : 'failed',
      entity: 'payment',
      amount: 10000, // Mock amount
      currency: 'USD',
      method: 'card'
    };

    res.json({ success: true, payment: paymentStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
