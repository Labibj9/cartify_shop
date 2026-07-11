require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Order = require('./models/Order');
const User = require('./models/User');

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-ecommerce');
    
    const defaultVendor = await User.findOne({ email: 'vendor@ecommerce.com' });
    console.log('\n📦 Default Vendor:', defaultVendor?.name, defaultVendor?._id);
    
    const vendorProducts = await Product.find({ vendor: defaultVendor?._id }).select('_id title');
    console.log('✅ Vendor products count:', vendorProducts.length);
    
    if (vendorProducts.length > 0) {
      const productIds = vendorProducts.map(p => p._id);
      const orders = await Order.find({ 'orderItems.product': { $in: productIds } }).limit(5);
      console.log('📋 Orders with vendor products:', orders.length);
      
      if (orders.length > 0) {
        console.log('\n🛍️ Sample Order:');
        console.log('  Order ID:', orders[0]._id);
        console.log('  Customer:', orders[0].user);
        console.log('  Items:', orders[0].orderItems.length);
        console.log('  Status:', orders[0].orderStatus);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

test();
