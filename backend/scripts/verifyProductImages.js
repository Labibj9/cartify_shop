require('dotenv').config();
const mongoose = require('mongoose');
require('../models/Category');
const Product = require('../models/Product');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mern-ecommerce';
  await mongoose.connect(mongoUri);
};

const run = async () => {
  try {
    await connectDB();

    const products = await Product.find({}).populate('category', 'name').select('title images category');

    const missing = products.filter((product) => {
      const url = product.images?.[0]?.url;
      return !url || typeof url !== 'string' || url.trim().length === 0;
    });

    const tvSamples = products.filter((p) => /tv|qled|oled|television/i.test(p.title)).slice(0, 10);

    console.log(`Total products: ${products.length}`);
    console.log(`Missing images: ${missing.length}`);
    console.log('TV samples:');
    tvSamples.forEach((p) => {
      console.log(`- ${p.title} => ${p.images?.[0]?.url}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  }
};

run();
