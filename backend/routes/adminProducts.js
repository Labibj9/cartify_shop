const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getAllProducts,
  getProductsByVendor,
  blockProduct,
  unblockProduct,
  deleteProduct,
  bulkBlockProducts,
  bulkDeleteProducts,
} = require('../controllers/adminProductController');

const router = express.Router();

// All routes require auth + admin
router.use(auth, admin);

router.get('/', getAllProducts);
router.get('/vendor/:vendorId', getProductsByVendor);
router.put('/:id/block', blockProduct);
router.put('/:id/unblock', unblockProduct);
router.delete('/:id', deleteProduct);
router.post('/bulk-block', bulkBlockProducts);
router.post('/bulk-delete', bulkDeleteProducts);

module.exports = router;
