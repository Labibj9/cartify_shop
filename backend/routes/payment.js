const express = require('express');
const { 
  createPaymentOrder, 
  verifyPayment, 
  processPayment,
  getPaymentStatus,
  createUpiOrder,
  verifyUpiPayment,
} = require('../controllers/paymentController');
const {
  createPayPalOrder,
  capturePayPalOrder,
} = require('../controllers/paypalController');
const auth = require('../middleware/auth');

const router = express.Router();

// Create mock payment order
router.post('/create-order', auth, createPaymentOrder);

// Verify payment after completion
router.post('/verify', auth, verifyPayment);

// Process payment (simplified endpoint)
router.post('/process', auth, processPayment);

// Get payment status
router.get('/status/:paymentId', auth, getPaymentStatus);

// PayPal Smart Buttons APIs
router.post('/paypal/create-order', auth, createPayPalOrder);
router.post('/paypal/capture-order', auth, capturePayPalOrder);

// UPI (Razorpay) APIs
router.post('/upi/create-order', auth, createUpiOrder);
router.post('/upi/verify', auth, verifyUpiPayment);

module.exports = router;
