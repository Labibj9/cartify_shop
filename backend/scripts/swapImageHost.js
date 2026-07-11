const mongoose = require('mongoose');
const Product = require('../models/Product');
const { resolveProductImage } = require('../utils/productImageResolver');
require('dotenv').config();

const swapImageHost = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MONGO_URI not set');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Find all products with old placeholder domain
    const products = await Product.find({
      'images.url': { $regex: 'via.placeholder.com', $options: 'i' }
    });

    console.log(`📋 Found ${products.length} products with via.placeholder.com URLs`);

    let updated = 0;
    for (const product of products) {
      // Update each product with new image URLs based on category
      product.images = [{
        url: resolveProductImage(product.title, product.category),
        public_id: null
      }];

      await product.save();
      updated++;
      console.log(`✅ Updated: ${product.title}`);
    }

    console.log(`\n✨ Successfully updated ${updated} products from via.placeholder.com to placehold.co`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

swapImageHost();
