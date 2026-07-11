const express = require('express');
const { 
  createOrder, 
  getMyOrders, 
  getAllOrders, 
  getOrderById, 
  updateOrderStatus,
  updatePaymentStatus 
} = require('../controllers/orderController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// User routes
router.post('/create', auth, createOrder);
router.get('/my-orders', auth, getMyOrders);

// Admin routes
router.get('/admin/all-orders', auth, admin, getAllOrders);
router.put('/:id/status', auth, admin, updateOrderStatus);
router.put('/:id/payment-status', auth, admin, updatePaymentStatus);

router.get('/:id', auth, getOrderById);

module.exports = router;
