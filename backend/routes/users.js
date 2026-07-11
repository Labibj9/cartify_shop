const express = require('express');
const { addToWishlist, removeFromWishlist, getWishlist, addAddress } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Wishlist routes (support both legacy and current client paths)
router.post('/wishlist', auth, addToWishlist);
router.post('/wishlist/add', auth, addToWishlist);
router.delete('/wishlist/remove/:productId', auth, removeFromWishlist);
router.delete('/wishlist/:productId', auth, removeFromWishlist);
router.get('/wishlist', auth, getWishlist);
router.post('/address', auth, addAddress);

module.exports = router;
