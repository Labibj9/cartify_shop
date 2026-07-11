const express = require('express');
const { getDashboardStats, getAllUsers, getAllOrders, getAllProducts, deleteUser, updateUserRole } = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

router.get('/stats', auth, admin, getDashboardStats);
router.get('/users', auth, admin, getAllUsers);
router.get('/orders', auth, admin, getAllOrders);
router.get('/products', auth, admin, getAllProducts);
router.delete('/users/:id', auth, admin, deleteUser);
router.put('/users/:id/role', auth, admin, updateUserRole);

module.exports = router;
