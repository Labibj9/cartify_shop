const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        originalPrice: {
          type: Number,
          default: null,
        },
        convertedPrice: {
          type: Number,
          default: null,
        },
        currencyUsed: {
          type: String,
          enum: ['INR', 'USD', 'EUR', 'GBP'],
          default: 'INR',
        },
        quantity: {
          type: Number,
          required: true,
        },
        image: String,
      },
    ],
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'ONLINE', 'UPI', 'PAYPAL'],
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'confirmed', 'dispatched', 'shipped', 'delivered', 'cancelled'],
      default: 'processing',
    },
    subtotal: {
      type: Number,
      required: true,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    convertedPrice: {
      type: Number,
      default: null,
    },
    currencyUsed: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP'],
      default: 'INR',
    },
    paymentResult: {
      provider: {
        type: String,
        default: null,
      },
      paypalOrderId: {
        type: String,
        default: null,
      },
      captureId: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        default: null,
      },
      payerEmail: {
        type: String,
        default: null,
      },
      amount: {
        type: Number,
        default: null,
      },
      currency: {
        type: String,
        default: null,
      },
      raw: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },
    paidAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
