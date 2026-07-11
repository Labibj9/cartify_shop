const express = require('express');
const auth = require('../middleware/auth');
const vendor = require('../middleware/vendor');
const upload = require('../middleware/upload');
const {
  registerVendor,
  getVendorProfile,
  updateVendorProfile,
  getMyProducts,
  getMyOrders,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  getVendorReviews,
  updateVendorOrderStatus,
  getVendorStats,
  getNotifications,
  markNotificationRead,
} = require('../controllers/vendorController');

const router = express.Router();

// Public route
router.post('/register', registerVendor);

// Protected vendor routes (requires auth + vendor role + approved)
router.get('/profile', auth, vendor, getVendorProfile);
router.put('/profile', auth, vendor, updateVendorProfile);
router.get('/products', auth, vendor, getMyProducts);
router.post('/products', auth, vendor, upload.single('images'), createVendorProduct);
router.put('/products/:id', auth, vendor, upload.single('images'), updateVendorProduct);
  router.delete('/products/:id', auth, vendor, deleteVendorProduct);
  router.get('/orders', auth, vendor, getMyOrders);
  router.get('/reviews', auth, vendor, getVendorReviews);
  router.put('/orders/:id/status', auth, vendor, updateVendorOrderStatus);
router.get('/stats', auth, vendor, getVendorStats);
router.get('/notifications', auth, vendor, getNotifications);
router.put('/notifications/:notificationId/read', auth, vendor, markNotificationRead);

module.exports = router;
