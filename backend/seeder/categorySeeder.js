require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-ecommerce');
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const seedCategories = async () => {
  try {
    // Clear existing categories
    await Category.deleteMany({});
    console.log('🗑️  Cleared old categories');

    // Define category structure
    const categoriesData = [
      {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        displayOrder: 1,
        children: [
          { name: 'Mobiles', description: 'Smartphones and mobile devices' },
          { name: 'Laptops', description: 'Laptops and notebooks' },
          { name: 'TVs', description: 'Television sets' },
        ],
      },
      {
        name: 'Furniture',
        description: 'Home furniture and fixtures',
        displayOrder: 2,
        children: [
          { name: 'Chairs', description: 'Seating furniture' },
          { name: 'Tables', description: 'Tables and desks' },
          { name: 'Beds', description: 'Bed frames and mattresses' },
        ],
      },
      {
        name: 'Fashion',
        description: 'Clothing and accessories',
        displayOrder: 3,
        children: [
          { name: 'Men', description: "Men's clothing and fashion" },
          { name: 'Women', description: "Women's clothing and fashion" },
          { name: 'Kids', description: "Kids' clothing" },
        ],
      },
      {
        name: 'Books',
        description: 'Books and educational materials',
        displayOrder: 4,
        children: [
          { name: 'Fiction', description: 'Fiction books' },
          { name: 'Non-Fiction', description: 'Non-fiction books' },
          { name: 'Educational', description: 'Educational books' },
        ],
      },
    ];

    // Create parent categories and their children
    for (const categoryData of categoriesData) {
      // Create parent category
      const parentCategory = await Category.create({
        name: categoryData.name,
        description: categoryData.description,
        displayOrder: categoryData.displayOrder,
        parentCategory: null,
        isActive: true,
      });

      console.log(`✅ Created parent category: ${parentCategory.name}`);

      // Create child categories
      if (categoryData.children && categoryData.children.length > 0) {
        for (let i = 0; i < categoryData.children.length; i++) {
          const childData = categoryData.children[i];
          const childCategory = await Category.create({
            name: childData.name,
            description: childData.description,
            parentCategory: parentCategory._id,
            displayOrder: i + 1,
            isActive: true,
          });

          console.log(`   └─ Created subcategory: ${childCategory.name}`);
        }
      }
    }

    console.log('\n🎉 All categories seeded successfully!');

    // Display the tree structure
    const topLevel = await Category.find({ parentCategory: null }).sort({ displayOrder: 1 });
    
    console.log('\n📊 Category Tree Structure:');
    for (const parent of topLevel) {
      console.log(`\n${parent.name}`);
      const children = await Category.find({ parentCategory: parent._id }).sort({ displayOrder: 1 });
      for (const child of children) {
        console.log(`   └─ ${child.name}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeder
connectDB().then(() => {
  seedCategories();
});
