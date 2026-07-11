require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
require('../models/Category');
const { resolveProductImage } = require('../utils/productImageResolver');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mern-ecommerce';
  await mongoose.connect(mongoUri);
};

const run = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const products = await Product.find({}).populate('category', 'name');
    if (products.length === 0) {
      console.log('No products found.');
      process.exit(0);
    }

    let updated = 0;

    for (const product of products) {
      const categoryName = product.category?.name || '';
      const newUrl = resolveProductImage(product.title, categoryName);

      const currentUrl = product.images?.[0]?.url;
      if (!currentUrl || currentUrl !== newUrl) {
        await Product.updateOne(
          { _id: product._id },
          { $set: { images: [{ url: newUrl }] } }
        );
        updated += 1;
      }
    }

    const refreshedProducts = await Product.find({}).select('images');
    const missingImages = refreshedProducts.filter((product) => {
      const url = product.images?.[0]?.url;
      return !url || typeof url !== 'string' || url.trim().length === 0;
    }).length;

    console.log(`✅ Updated ${updated} products with category-appropriate images.`);
    console.log(`📌 Products still missing images: ${missingImages}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update product images:', error.message);
    process.exit(1);
  }
};

run();
