const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { BASE_CURRENCY, normalizeCurrency, convertPrice } = require('../services/currencyService');

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, items: [] });
    }

    const exists = wishlist.items.some((item) => item.product.toString() === productId.toString());
    if (!exists) {
      wishlist.items.push({ product: productId, addedAt: new Date() });
      await wishlist.save();
    }

    const populated = await Wishlist.findOne({ user: req.user.id }).populate('items.product');
    return res.json({ success: true, message: exists ? 'Already in wishlist' : 'Added to wishlist', wishlist: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.items = wishlist.items.filter((item) => item.product.toString() !== productId.toString());
    await wishlist.save();

    const populated = await Wishlist.findOne({ user: req.user.id }).populate('items.product');
    return res.json({ success: true, message: 'Removed from wishlist', wishlist: populated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const targetCurrency = normalizeCurrency(req.query.currency || BASE_CURRENCY);
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate('items.product');

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, items: [] });
      wishlist = await Wishlist.findById(wishlist._id).populate('items.product');
    }

    const wishlistObj = wishlist.toObject();
    wishlistObj.items = await Promise.all(
      wishlistObj.items.map(async (entry) => {
        if (!entry.product) return entry;
        const product = { ...entry.product };
        product.price = await convertPrice(product.price, targetCurrency);
        if (typeof product.originalPrice === 'number') {
          product.originalPrice = await convertPrice(product.originalPrice, targetCurrency);
        }
        product.currency = targetCurrency;
        return { ...entry, product };
      })
    );

    return res.json({ success: true, wishlist: wishlistObj, currency: targetCurrency });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
