const Category = require('../models/Category');
const Product = require('../models/Product');

// Get all categories with nested tree structure
exports.getAllCategories = async (req, res) => {
  try {
    const topLevelCategories = await Category.find({
      parentCategory: null,
      isActive: true,
    })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    const buildCategoryTree = async (categories) => {
      const tree = [];
      for (let category of categories) {
        const categoryNode = {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          displayOrder: category.displayOrder,
          children: [],
        };

        const children = await Category.find({
          parentCategory: category._id,
          isActive: true,
        })
          .sort({ displayOrder: 1, name: 1 })
          .lean();

        if (children.length > 0) {
          categoryNode.children = await buildCategoryTree(children);
        }

        tree.push(categoryNode);
      }
      return tree;
    };

    const categoriesTree = await buildCategoryTree(topLevelCategories);

    res.status(200).json({
      success: true,
      count: categoriesTree.length,
      data: categoriesTree,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get category by slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate('parentCategory', 'slug name');

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parentCategory', 'name');

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.status(200).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get subcategories for parent
exports.getSubcategories = async (req, res) => {
  try {
    const subcategories = await Category.find({
      parentCategory: req.params.id,
      isActive: true,
    }).sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: subcategories.length,
      data: subcategories,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create category (admin)
exports.createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, image, displayOrder } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    let existingCategory;
    if (parentCategory) {
      existingCategory = await Category.findOne({
        name: { $regex: `^${name}$`, $options: 'i' },
        parentCategory,
      });
    } else {
      existingCategory = await Category.findOne({
        name: { $regex: `^${name}$`, $options: 'i' },
        parentCategory: null,
      });
    }

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists at this level',
      });
    }

    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent category not found' });
      }
    }

    const category = await Category.create({
      name,
      description,
      parentCategory: parentCategory || null,
      image,
      displayOrder: displayOrder || 0,
      isActive: true,
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update category (admin)
exports.updateCategory = async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, parentCategory, image, displayOrder, isActive } = req.body;

    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: `^${name}$`, $options: 'i' },
        parentCategory: parentCategory || category.parentCategory,
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists at this level',
        });
      }
    }

    if (parentCategory && parentCategory.toString() !== category.parentCategory?.toString()) {
      let checkCateg = parentCategory;
      while (checkCateg) {
        const parent = await Category.findById(checkCateg);
        if (parent && parent.parentCategory) {
          if (parent.parentCategory.toString() === req.params.id) {
            return res.status(400).json({
              success: false,
              message: 'Circular category reference detected',
            });
          }
          checkCateg = parent.parentCategory;
        } else {
          break;
        }
      }

      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent category not found' });
      }
    }

    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (image) category.image = image;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (isActive !== undefined) category.isActive = isActive;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;

    category = await category.save();

    res.status(200).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete category (admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const childCount = await Category.countDocuments({
      parentCategory: req.params.id,
    });

    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${childCount} subcategories. Delete subcategories first.`,
      });
    }

    const productCount = await Product.countDocuments({
      $or: [{ category: req.params.id }, { subCategory: req.params.id }],
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products. Move or delete products first.`,
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all categories flat (admin)
exports.getAllCategoriesFlat = async (req, res) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get full category tree (admin - includes inactive)
exports.getFullCategoryTree = async (req, res) => {
  try {
    const topLevelCategories = await Category.find({
      parentCategory: null,
    })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    const buildCategoryTree = async (categories) => {
      const tree = [];

      for (let category of categories) {
        const categoryNode = {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          isActive: category.isActive,
          displayOrder: category.displayOrder,
          children: [],
        };

        const children = await Category.find({
          parentCategory: category._id,
        })
          .sort({ displayOrder: 1, name: 1 })
          .lean();

        if (children.length > 0) {
          categoryNode.children = await buildCategoryTree(children);
        }

        tree.push(categoryNode);
      }

      return tree;
    };

    const categoriesTree = await buildCategoryTree(topLevelCategories);

    res.status(200).json({
      success: true,
      count: categoriesTree.length,
      data: categoriesTree,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
