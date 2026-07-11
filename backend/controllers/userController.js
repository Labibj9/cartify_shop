const User = require('../models/User');
const Product = require('../models/Product');

// Add to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    console.log('💖 AddToWishlist request:', { productId, userId: req.user?.id });
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const alreadyInWishlist = user.wishlist.some((id) => id.toString() === productId.toString());
    if (!alreadyInWishlist) {
      user.wishlist.push(productId);
      await user.save();
      console.log('✅ Wishlist updated: item added');
    } else {
      console.log('ℹ️ Wishlist unchanged: item already exists');
    }

    const populatedUser = await User.findById(req.user.id).populate('wishlist');
    res.json({ success: true, wishlist: populatedUser.wishlist });
  } catch (err) {
    console.error('❌ AddToWishlist error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Remove from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get wishlist
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add address
exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
