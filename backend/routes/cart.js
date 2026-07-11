const express = require('express');
const { getCart, addToCart, updateCart, removeFromCart, clearCart } = require('../controllers/cartController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, getCart);
router.post('/add', auth, addToCart);
router.put('/update', auth, updateCart);
router.delete('/remove/:productId', auth, removeFromCart);
router.delete('/clear', auth, clearCart);

module.exports = router;
