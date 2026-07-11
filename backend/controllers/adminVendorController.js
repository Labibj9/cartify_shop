const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const VendorNotification = require('../models/VendorNotification');

// Create vendor (admin)
exports.createVendor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      businessName,
      phone,
      address,
      gstNumber,
      registrationNumber,
      isApproved = true,
    } = req.body;

    if (!name || !email || !password || !businessName) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and business name are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const vendor = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'vendor',
      isApproved: Boolean(isApproved),
      vendorProfile: {
        businessName,
        phone: phone || '',
        address: address || '',
        gstNumber: gstNumber || '',
        registrationNumber: registrationNumber || '',
        isVerified: false,
      },
    });

    const vendorObj = vendor.toObject();
    delete vendorObj.password;

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      vendor: vendorObj,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all vendors
exports.getAllVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    const filter = { role: 'vendor' };
    if (status === 'approved') {
      filter.isApproved = true;
    } else if (status === 'pending') {
      filter.isApproved = false;
    } else if (status === 'verified') {
      filter['vendorProfile.isVerified'] = true;
    }

    const vendors = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      vendors,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get vendor details with stats
exports.getVendorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await User.findById(id).select('-password');
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Get vendor stats
    const totalProducts = await Product.countDocuments({ vendor: id });
    const activeProducts = await Product.countDocuments({ vendor: id, isActive: true });
    const blockedProducts = await Product.countDocuments({ vendor: id, isActive: false });

    // Get total sales
    const vendorProductIds = await Product.find({ vendor: id }).select('_id');
    const orders = await Order.find({
      'orderItems.product': { $in: vendorProductIds.map((p) => p._id) },
    }).populate('orderItems.product', 'vendor price');

    let totalRevenue = 0;
    let totalOrders = new Set();
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (item.product.vendor.toString() === id) {
          totalRevenue += item.price * item.quantity;
          totalOrders.add(order._id);
        }
      });
    });

    // Get products
    const products = await Product.find({ vendor: id })
      .select('title price stock isActive vendorApprovalStatus createdAt')
      .limit(5)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      vendor,
      stats: {
        totalProducts,
        activeProducts,
        blockedProducts,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders: totalOrders.size,
      },
      recentProducts: products,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Approve vendor
exports.approveVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.isApproved = true;
    await vendor.save();

    // Create notification
    await VendorNotification.create({
      vendor: id,
      type: 'approval',
      title: 'Vendor Account Approved',
      message: notes || 'Your vendor account has been approved by the admin. You can now upload products.',
    });

    res.status(200).json({ success: true, message: 'Vendor approved successfully', vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Reject vendor
exports.rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.isApproved = false;
    await vendor.save();

    // Create notification
    await VendorNotification.create({
      vendor: id,
      type: 'rejection',
      title: 'Vendor Account Rejected',
      message: reason || 'Your vendor account registration has been rejected. Please contact support for details.',
    });

    res.status(200).json({ success: true, message: 'Vendor rejected', vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Verify vendor (GST/Business verification)
exports.verifyVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.vendorProfile.isVerified = true;
    await vendor.save();

    // Create notification
    await VendorNotification.create({
      vendor: id,
      type: 'verification',
      title: 'Business Verified',
      message: 'Your business documents have been verified by the admin.',
    });

    res.status(200).json({ success: true, message: 'Vendor verified successfully', vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete vendor and their products
exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await User.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Delete all vendor products
    await Product.deleteMany({ vendor: id });

    // Delete all vendor notifications
    await VendorNotification.deleteMany({ vendor: id });

    // Delete vendor user
    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Vendor and all their products deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
