const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  createVendor,
  getAllVendors,
  getVendorDetails,
  approveVendor,
  rejectVendor,
  verifyVendor,
  deleteVendor,
} = require('../controllers/adminVendorController');

const router = express.Router();

// All routes require auth + admin
router.use(auth, admin);

router.post('/', createVendor);
router.get('/', getAllVendors);
router.get('/:id', getVendorDetails);
router.put('/:id/approve', approveVendor);
router.put('/:id/reject', rejectVendor);
router.put('/:id/verify', verifyVendor);
router.delete('/:id', deleteVendor);

module.exports = router;
