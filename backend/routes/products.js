const express = require('express');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, addReview } = require('../controllers/productController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const adminOrVendor = require('../middleware/adminOrVendor');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', auth, adminOrVendor, upload.single('image'), createProduct);
router.put('/:id', auth, adminOrVendor, upload.single('image'), updateProduct);
router.delete('/:id', auth, adminOrVendor, deleteProduct);
router.post('/:id/reviews', auth, addReview);

module.exports = router;
