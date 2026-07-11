const mongoose = require('mongoose');

const vendorNotificationSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['approval', 'rejection', 'product_blocked', 'verification', 'product_approved'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: String,
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

vendorNotificationSchema.index({ vendor: 1, isRead: 1 });
vendorNotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('VendorNotification', vendorNotificationSchema);
