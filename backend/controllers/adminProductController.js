const Product = require('../models/Product');
const User = require('../models/User');

// Get all products (admin view)
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', search = '' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status !== 'all') {
      if (status === 'blocked') {
        filter.isActive = false;
      } else if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'low-stock') {
        filter.stock = { $lt: 10 };
      }
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter)
      .populate('vendor', 'name email vendorProfile.businessName')
      .populate('category', 'name')
      .select('title price stock isActive vendorApprovalStatus images vendor category createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      products,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get products by status or vendor
exports.getProductsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Verify vendor exists
    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const products = await Product.find({ vendor: vendorId })
      .select('title price stock images isActive vendorApprovalStatus createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments({ vendor: vendorId });

    res.status(200).json({
      success: true,
      products,
      vendor: { id: vendor._id, name: vendor.name, businessName: vendor.vendorProfile?.businessName },
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Block product (soft delete)
exports.blockProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true }).populate(
      'vendor',
      'name email'
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Notify vendor
    const VendorNotification = require('../models/VendorNotification');
    await VendorNotification.create({
      vendor: product.vendor._id,
      type: 'product_blocked',
      title: `Product Blocked: ${product.title}`,
      message: reason || 'Your product has been blocked by the admin.',
      relatedId: product._id,
    });

    res.status(200).json({ success: true, message: 'Product blocked successfully', product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Unblock product
exports.unblockProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(id, { isActive: true }, { new: true }).populate(
      'vendor',
      'name email'
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Notify vendor
    const VendorNotification = require('../models/VendorNotification');
    await VendorNotification.create({
      vendor: product.vendor._id,
      type: 'product_approved',
      title: `Product Unblocked: ${product.title}`,
      message: 'Your product has been re-activated.',
      relatedId: product._id,
    });

    res.status(200).json({ success: true, message: 'Product unblocked successfully', product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete product (hard delete)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Bulk block products
exports.bulkBlockProducts = async (req, res) => {
  try {
    const { productIds, reason } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide product IDs' });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { isActive: false },
      { multi: true }
    );

    // Notify vendors
    const VendorNotification = require('../models/VendorNotification');
    const products = await Product.find({ _id: { $in: productIds } }).select('vendor title');

    for (const product of products) {
      await VendorNotification.create({
        vendor: product.vendor,
        type: 'product_blocked',
        title: `Product Blocked: ${product.title}`,
        message: reason || 'Your product has been blocked by the admin.',
        relatedId: product._id,
      });
    }

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} products blocked successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Bulk delete products
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide product IDs' });
    }

    const result = await Product.deleteMany({ _id: { $in: productIds } });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} products deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
