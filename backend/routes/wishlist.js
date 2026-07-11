const express = require('express');
const auth = require('../middleware/auth');
const { addToWishlist, removeFromWishlist, getWishlist } = require('../controllers/wishlistController');

const router = express.Router();

router.post('/add/:productId', auth, addToWishlist);
router.delete('/remove/:productId', auth, removeFromWishlist);
router.get('/', auth, getWishlist);

module.exports = router;
