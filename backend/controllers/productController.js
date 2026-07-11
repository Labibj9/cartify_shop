const Product = require('../models/Product');
const Review = require('../models/Review');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const { BASE_CURRENCY, normalizeCurrency, convertPrice, convertToINR } = require('../services/currencyService');

const uploadBufferToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'mern-products', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete old Cloudinary image:', error.message);
  }
};

// Helper function to delete local uploaded image
const deleteLocalImage = (imagePath) => {
  if (!imagePath) return;
  try {
    const fullPath = path.join(__dirname, '../', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Failed to delete local image:', error.message);
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, subCategory, minPrice, maxPrice, sort, currency } = req.query;
    const targetCurrency = normalizeCurrency(currency || BASE_CURRENCY);
    const query = { isActive: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter - handle both string ID and slug
    // Includes selected category + all descendant categories
    if (category) {
      let selectedCategoryId = null;

      if (mongoose.Types.ObjectId.isValid(category)) {
        selectedCategoryId = new mongoose.Types.ObjectId(category);
      } else {
        const catDoc = await Category.findOne({ slug: category });
        if (catDoc) {
          selectedCategoryId = catDoc._id;
        }
      }

      if (selectedCategoryId) {
        const categoryIds = [selectedCategoryId];
        const queue = [selectedCategoryId];

        // BFS for descendants using parentCategory
        while (queue.length > 0) {
          const parentId = queue.shift();
          const children = await Category.find({ parentCategory: parentId }).select('_id');
          for (const child of children) {
            const childId = child._id;
            if (!categoryIds.some((id) => id.toString() === childId.toString())) {
              categoryIds.push(childId);
              queue.push(childId);
            }
          }
        }

        query.$or = [
          { category: { $in: categoryIds } },
          { subCategory: { $in: categoryIds } },
        ];
      }
    }

    // Subcategory filter
    if (subCategory && mongoose.Types.ObjectId.isValid(subCategory)) {
      query.subCategory = new mongoose.Types.ObjectId(subCategory);
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        const minValueInINR = await convertToINR(parseFloat(minPrice), targetCurrency);
        query.price.$gte = minValueInINR;
      }
      if (maxPrice) {
        const maxValueInINR = await convertToINR(parseFloat(maxPrice), targetCurrency);
        query.price.$lte = maxValueInINR;
      }
    }

    // Sorting
    let sortObj = {};
    if (sort === 'price_asc') sortObj = { price: 1 };
    else if (sort === 'price_desc') sortObj = { price: -1 };
    else if (sort === 'rating') sortObj = { ratingsAverage: -1 };
    else if (sort === 'newest') sortObj = { createdAt: -1 };

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    const transformedProducts = await Promise.all(
      products.map(async (product) => {
        const productObj = product.toObject();
        productObj.price = await convertPrice(productObj.price, targetCurrency);
        if (typeof productObj.originalPrice === 'number') {
          productObj.originalPrice = await convertPrice(productObj.originalPrice, targetCurrency);
        }
        productObj.currency = targetCurrency;
        return productObj;
      })
    );

    res.json({
      success: true,
      products: transformedProducts,
      total,
      page,
      pages: Math.ceil(total / limit),
      currency: targetCurrency,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const targetCurrency = normalizeCurrency(req.query.currency || BASE_CURRENCY);
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate({ path: 'reviews', populate: { path: 'user', select: 'name' } });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productObj = product.toObject();
    productObj.price = await convertPrice(productObj.price, targetCurrency);
    if (typeof productObj.originalPrice === 'number') {
      productObj.originalPrice = await convertPrice(productObj.originalPrice, targetCurrency);
    }
    productObj.currency = targetCurrency;

    res.json({ success: true, product: productObj, currency: targetCurrency });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create product (admin)
exports.createProduct = async (req, res) => {
  try {
    const { category, subCategory } = req.body;

    // Validate category exists
    if (category) {
      const Category = require('../models/Category');
      const catExists = await Category.findById(category);
      if (!catExists) {
        return res.status(400).json({
          success: false,
          message: `Category with ID ${category} not found`,
        });
      }
    }

    // Validate subcategory exists if provided
    if (subCategory) {
      const Category = require('../models/Category');
      const subCatExists = await Category.findById(subCategory);
      if (!subCatExists) {
        return res.status(400).json({
          success: false,
          message: `Subcategory with ID ${subCategory} not found`,
        });
      }
    }

    const productData = {
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : req.body.price,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : req.body.stock,
      discount: req.body.discount !== undefined ? Number(req.body.discount) : req.body.discount,
      vendor: req.user.id,
    };

    // Handle local file upload
  // Upload image to Cloudinary
if (req.file) {
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "mern-products",
    resource_type: "image",
  });

  productData.image = result.secure_url;
  productData.cloudinaryPublicId = result.public_id;

  // Delete temporary local file
  if (fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }
}
    // Handle old Cloudinary image uploads if needed
    else if (req.files && req.files.length > 0) {
      const imageFiles = req.files;
      const uploadedImages = [];
      for (const file of imageFiles) {
        const result = await uploadBufferToCloudinary(file.buffer);
        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
      productData.images = uploadedImages;
    }

    const product = new Product(productData);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('vendor', 'name email vendorProfile.businessName');

    res.status(201).json({ success: true, product: populatedProduct });
  } catch (err) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      deleteLocalImage(`/uploads/${req.file.filename}`);
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update product (admin)
exports.updateProduct = async (req, res) => {
  try {
    const { category, subCategory } = req.body;

    // Validate category exists if being updated
    if (category) {
      const Category = require('../models/Category');
      const catExists = await Category.findById(category);
      if (!catExists) {
        return res.status(400).json({
          success: false,
          message: `Category with ID ${category} not found`,
        });
      }
    }

    // Validate subcategory exists if provided
    if (subCategory) {
      const Category = require('../models/Category');
      const subCatExists = await Category.findById(subCategory);
      if (!subCatExists) {
        return res.status(400).json({
          success: false,
          message: `Subcategory with ID ${subCategory} not found`,
        });
      }
    }

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updateData = {
      ...req.body,
      price: req.body.price !== undefined ? Number(req.body.price) : existingProduct.price,
      stock: req.body.stock !== undefined ? Number(req.body.stock) : existingProduct.stock,
      discount: req.body.discount !== undefined ? Number(req.body.discount) : existingProduct.discount,
    };

    // Handle local file upload
// Upload image to Cloudinary
if (req.file) {
  // Delete old Cloudinary image
  if (existingProduct.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(existingProduct.cloudinaryPublicId);
  }

  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "mern-products",
    resource_type: "image",
  });

  updateData.image = result.secure_url;
  updateData.cloudinaryPublicId = result.public_id;

  // Delete temporary local file
  if (fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }
}
    // Handle old Cloudinary image uploads if needed
    else if (req.files && req.files.length > 0) {
      const uploadedImages = [];
      for (const file of req.files) {
        const result = await uploadBufferToCloudinary(file.buffer);
        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }

      // Delete old Cloudinary images
      if (existingProduct.images && existingProduct.images.length > 0) {
        for (const image of existingProduct.images) {
          await deleteCloudinaryImage(image.public_id);
        }
      }
      updateData.images = uploadedImages;
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');

    res.json({ success: true, product });
  } catch (err) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      deleteLocalImage(`/uploads/${req.file.filename}`);
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete product (admin)
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add review
exports.addReview = async (req, res) => {
  try {
    const { rating, comment, title } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const review = new Review({
      rating,
      comment,
      title,
      user: req.user.id,
      product: req.params.id,
    });
    await review.save();

    product.reviews.push(review._id);
    const avgRating = await Review.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (avgRating.length > 0) {
      product.ratingsAverage = avgRating[0].avg;
      product.ratingsCount = avgRating[0].count;
    }
    await product.save();

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
