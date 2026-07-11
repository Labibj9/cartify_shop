const paypal = require('@paypal/checkout-server-sdk');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { convertPrice } = require('../services/currencyService');

const getPayPalClient = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are missing. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
  }

  const environment = process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);

  return new paypal.core.PayPalHttpClient(environment);
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

    orderItems.push({
      product: productId,
      title: item?.product?.title || item?.title || product.title,
      price: Number(item.priceAtPurchase || product.price || 0),
      originalPrice: Number(item.priceAtPurchase || product.price || 0),
      quantity: item.quantity,
      image: item?.product?.image || item?.image,
      currencyUsed: 'USD',
    });

    subtotalINR += Number(item.priceAtPurchase || product.price || 0) * item.quantity;
  }

  const shippingINR = subtotalINR > 500 ? 0 : 50;
  const taxINR = Math.round(subtotalINR * 0.18);
  const totalINR = subtotalINR + shippingINR + taxINR;
  const totalUSD = await convertPrice(totalINR, 'USD');

  return {
    cart,
    orderItems,
    subtotalINR,
    shippingINR,
    taxINR,
    totalINR,
    totalUSD,
  };
};

exports.createPayPalOrder = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    console.log('PayPal create-order request received', {
      userId: req.user?.id,
      hasShippingAddress: !!shippingAddress,
    });

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    const {
      orderItems,
      subtotalINR,
      shippingINR,
      taxINR,
      totalINR,
      totalUSD,
    } = await buildPendingOrderFromCart(req.user.id);

    const localOrder = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod: 'PAYPAL',
      paymentStatus: 'pending',
      orderStatus: 'processing',
      subtotal: subtotalINR,
      shipping: shippingINR,
      tax: taxINR,
      totalPrice: totalINR,
      originalPrice: totalINR,
      convertedPrice: totalUSD,
      currencyUsed: 'USD',
      paymentResult: {
        provider: 'paypal',
      },
    });

    await localOrder.save();

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: localOrder._id.toString(),
          custom_id: localOrder._id.toString(),
          amount: {
            currency_code: 'USD',
            value: totalUSD.toFixed(2),
          },
        },
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    });

    const paypalClient = getPayPalClient();
    const paypalOrder = await paypalClient.execute(request);

    localOrder.paymentResult = {
      ...(localOrder.paymentResult || {}),
      provider: 'paypal',
      paypalOrderId: paypalOrder.result.id,
      status: paypalOrder.result.status,
      raw: paypalOrder.result,
    };
    await localOrder.save();

    return res.json({
      success: true,
      orderID: paypalOrder.result.id,
      localOrderId: localOrder._id,
    });
  } catch (err) {
    const details = err?.result?.details?.[0]?.description;
    const message = details || err.message || 'Failed to create PayPal order';
    console.error('PayPal create-order error:', message);
    return res.status(500).json({ success: false, message });
  }
};

exports.capturePayPalOrder = async (req, res) => {
  try {
    const { orderID, localOrderId } = req.body;

    console.log('PayPal capture-order request received', {
      userId: req.user?.id,
      orderID,
      localOrderId,
    });

    if (!orderID || !localOrderId) {
      return res.status(400).json({ success: false, message: 'orderID and localOrderId are required' });
    }

    const localOrder = await Order.findOne({ _id: localOrderId, user: req.user.id });
    if (!localOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (localOrder.paymentStatus === 'paid') {
      return res.json({ success: true, message: 'Order already captured', order: localOrder });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const paypalClient = getPayPalClient();
    const captureResponse = await paypalClient.execute(request);
    const result = captureResponse.result;

    if (result.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `PayPal capture not completed. Status: ${result.status}`,
      });
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

    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];

    localOrder.paymentStatus = 'paid';
    localOrder.paidAt = new Date();
    localOrder.paymentResult = {
      provider: 'paypal',
      paypalOrderId: result.id,
      captureId: capture?.id || null,
      status: capture?.status || result.status,
      payerEmail: result.payer?.email_address || null,
      amount: Number(capture?.amount?.value || localOrder.convertedPrice || 0),
      currency: capture?.amount?.currency_code || 'USD',
      raw: result,
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
      message: 'Payment captured and order completed',
      order: {
        _id: localOrder._id,
        paymentStatus: localOrder.paymentStatus,
        orderStatus: localOrder.orderStatus,
      },
    });
  } catch (err) {
    const details = err?.result?.details?.[0]?.description;
    const message = details || err.message || 'Failed to capture PayPal order';
    console.error('PayPal capture-order error:', message);
    return res.status(500).json({ success: false, message });
  }
};
