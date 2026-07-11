const express = require('express');
const {
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
  getSubcategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategoriesFlat,
  getFullCategoryTree,
} = require('../controllers/categoryController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// Admin routes - Static routes must come BEFORE dynamic :id routes
router.get('/admin/list/all', auth, admin, getAllCategoriesFlat);
router.get('/admin/tree/full', auth, admin, getFullCategoryTree);

// Public routes - Get nested category tree structure
router.get('/', getAllCategories);

// Get category by slug (friendly URL) - Must come before :id routes
router.get('/slug/:slug', getCategoryBySlug);

// Get subcategories for a parent - Must come before :id routes
router.get('/:id/subcategories', getSubcategories);

// Get category by ID - Must be last for safety
router.get('/:id', getCategoryById);

// Create new category
router.post('/', auth, admin, createCategory);

// Update category
router.put('/:id', auth, admin, updateCategory);

// Delete category
router.delete('/:id', auth, admin, deleteCategory);

module.exports = router;
