const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    phone: String,
    role: {
      type: String,
      enum: ['user', 'admin', 'vendor'],
      default: 'user',
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    vendorProfile: {
      businessName: String,
      phone: String,
      address: String,
      gstNumber: String,
      registrationNumber: String,
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    addresses: [
      {
        address: String,
        city: String,
        state: String,
        zip: String,
        country: String,
        isDefault: Boolean,
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
