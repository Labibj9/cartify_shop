const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Category = require('../models/Category');
const VendorNotification = require('../models/VendorNotification');
const bcryptjs = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Helper to delete a locally uploaded image
const deleteLocalImage = (imagePath) => {
  if (!imagePath) return;
  try {
    const fullPath = path.join(__dirname, '../', imagePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (error) {
    console.error('Failed to delete local image:', error.message);
  }
};

// Register as vendor
exports.registerVendor = async (req, res) => {
  try {
    const { name, email, password, phone, businessName, address, gstNumber, registrationNumber } = req.body;

    // Validation
    if (!name || !email || !password || !businessName || !gstNumber) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Create new vendor user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: 'vendor',
      isApproved: false,
      vendorProfile: {
        businessName,
        phone,
        address,
        gstNumber,
        registrationNumber,
        isVerified: false,
      },
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Vendor registered successfully. Awaiting admin approval.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get vendor profile
exports.getVendorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    res.status(200).json({ success: true, vendor: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update vendor profile
exports.updateVendorProfile = async (req, res) => {
  try {
    const { businessName, phone, address, gstNumber, registrationNumber } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Update vendor profile
    if (businessName) user.vendorProfile.businessName = businessName;
    if (phone) user.vendorProfile.phone = phone;
    if (address) user.vendorProfile.address = address;
    if (gstNumber) user.vendorProfile.gstNumber = gstNumber;
    if (registrationNumber) user.vendorProfile.registrationNumber = registrationNumber;

    await user.save();

    res.status(200).json({ success: true, message: 'Profile updated successfully', vendor: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get vendor's own products
exports.getMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    const filter = { vendor: req.user.id };
    if (status !== 'all') {
      filter.vendorApprovalStatus = status;
    }

    const products = await Product.find(filter)
      .select('title price stock images vendor vendorApprovalStatus isActive createdAt')
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

// Update status of an order containing the vendor's products
exports.updateVendorOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'dispatched', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Ensure the vendor owns at least one item in this order
    const vendorProductIds = (await Product.find({ vendor: req.user.id }).select('_id')).map((p) => p._id.toString());
    const vendorItem = order.orderItems.find((item) => {
      const productId = item.product?._id || item.product;
      return productId && vendorProductIds.includes(productId.toString());
    });

    if (!vendorItem) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus: status,
        deliveredAt: status === 'delivered' ? new Date() : order.deliveredAt,
        cancelledAt: status === 'cancelled' ? new Date() : order.cancelledAt,
      },
      { new: true }
    );

    res.json({ success: true, message: 'Order status updated', order: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get vendor's orders (orders containing their products)
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Find all products by this vendor
    const vendorProducts = await Product.find({ vendor: req.user.id }).select('_id');
    
    // If vendor has no products, return empty orders
    if (vendorProducts.length === 0) {
      return res.status(200).json({
        success: true,
        orders: [],
        pagination: { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 },
      });
    }
    
    const vendorProductIds = vendorProducts.map((p) => p._id);
    const vendorProductIdSet = new Set(vendorProductIds.map((id) => id.toString()));

    // Find orders containing these products
    const orders = await Order.find({
      'orderItems.product': { $in: vendorProductIds },
    })
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'title price')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({
      'orderItems.product': { $in: vendorProductIds },
    });

    // Filter orderItems to show only vendor's items
    const filteredOrders = orders.map((order) => ({
      ...order.toObject(),
      orderItems: order.orderItems.filter((item) => {
        const productId = item.product?._id || item.product;
        return productId && vendorProductIdSet.has(productId.toString());
      }),
    }));

    res.status(200).json({
      success: true,
      orders: filteredOrders,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create a new product (vendor)
exports.createVendorProduct = async (req, res) => {
  try {
    const { title, name, description, price, discountPrice, discount, stock, category } = req.body;

    const productTitle = title || name;
    if (!productTitle) {
      return res.status(400).json({ success: false, message: 'Product title is required' });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }
    if (price === undefined || price === '') {
      return res.status(400).json({ success: false, message: 'Price is required' });
    }

    const catExists = await Category.findById(category);
    if (!catExists) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }

    const productData = {
      title: productTitle,
      description: description || '',
      price: Number(price),
      discount: Number(discountPrice || discount || 0),
      stock: Number(stock || 0),
      category,
      vendor: req.user.id,
      vendorApprovalStatus: 'pending',
      isActive: true,
    };

    // Save uploaded image (field name: 'images')
    if (req.file) {
      const url = `/uploads/${req.file.filename}`;
      productData.image = url;
      productData.images = [{ url, public_id: null }];
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (err) {
    if (req.file) deleteLocalImage(`/uploads/${req.file.filename}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update own product (vendor) - manage stock, price, image, etc.
exports.updateVendorProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.vendor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this product' });
    }

    const { title, name, description, price, discountPrice, discount, stock, category } = req.body;

    if (title !== undefined) product.title = title || name || product.title;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined || discount !== undefined) {
      product.discount = Number(discountPrice || discount || 0);
    }
    if (stock !== undefined) product.stock = Number(stock);

    if (category) {
      const catExists = await Category.findById(category);
      if (!catExists) {
        return res.status(400).json({ success: false, message: 'Category not found' });
      }
      product.category = category;
    }

    if (req.file) {
      if (product.image) deleteLocalImage(product.image);
      const url = `/uploads/${req.file.filename}`;
      product.image = url;
      product.images = [{ url, public_id: null }];
    }

    await product.save();
    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (err) {
    if (req.file) deleteLocalImage(`/uploads/${req.file.filename}`);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete own product (vendor)
exports.deleteVendorProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.vendor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
    }

    if (product.image) deleteLocalImage(product.image);
    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get ratings & reviews for the vendor's products
exports.getVendorReviews = async (req, res) => {
  try {
    const vendorProductIds = (await Product.find({ vendor: req.user.id }).select('_id')).map((p) => p._id);
    const reviews = await Review.find({ product: { $in: vendorProductIds } })
      .populate('user', 'name email')
      .populate('product', 'title image images')
      .sort({ createdAt: -1 })
      .limit(100);

    const averageRating = reviews.length
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    res.json({
      success: true,
      reviews,
      count: reviews.length,
      averageRating: parseFloat(averageRating.toFixed(2)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get vendor dashboard stats
exports.getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Total products
    const totalProducts = await Product.countDocuments({ vendor: vendorId });

    // Active products
    const activeProducts = await Product.countDocuments({ vendor: vendorId, isActive: true });

    // Low stock products (< 10)
    const lowStockProducts = await Product.countDocuments({ vendor: vendorId, stock: { $lt: 10 } });

    // Total revenue calculation
    const vendorProductIds = await Product.find({ vendor: vendorId }).select('_id');
    const orders = await Order.find({
      'orderItems.product': { $in: vendorProductIds.map((p) => p._id) },
    }).populate('orderItems.product', 'vendor price');

    let totalRevenue = 0;
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (item.product.vendor.toString() === vendorId) {
          totalRevenue += item.price * item.quantity;
        }
      });
    });

    // Average rating
    const productsWithRatings = await Product.find({ vendor: vendorId, ratingsCount: { $gt: 0 } });
    const averageRating =
      productsWithRatings.length > 0
        ? (productsWithRatings.reduce((sum, p) => sum + p.ratingsAverage, 0) / productsWithRatings.length).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageRating: parseFloat(averageRating),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get vendor notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await VendorNotification.find({ vendor: req.user.id })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const unreadCount = await VendorNotification.countDocuments({
      vendor: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await VendorNotification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
