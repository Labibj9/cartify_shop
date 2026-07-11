const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a product title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a product price'],
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    originalPrice: Number,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category'],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    image: {
      type: String,
      default: null,
    },
    cloudinaryPublicId: {
  type: String,
  default: null,
},
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    vendorApprovalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create text index for search
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ vendor: 1 });
productSchema.index({ vendorApprovalStatus: 1 });
productSchema.index({ category: 1, vendor: 1 });
productSchema.index({ isActive: 1, vendor: 1 });
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
