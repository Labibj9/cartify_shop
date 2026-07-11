require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const { resolveProductImage } = require('../utils/productImageResolver');

const SEEDED_USD_TO_INR = Number(process.env.SEEDED_USD_TO_INR || 83.5);
const SEEDED_USD_OVERRIDES = {
  IPHONE15PM001: 380,
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-ecommerce');
    console.log('✅ MongoDB Connected for product seeding');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const seedProducts = async () => {
  try {
    // Create or get default vendors for seeded products
    let defaultVendor = await User.findOne({ email: 'vendor@ecommerce.com' });
    if (!defaultVendor) {
      defaultVendor = new User({
        name: 'Default Vendor',
        email: 'vendor@ecommerce.com',
        password: 'hashedPassword123',
        role: 'vendor',
        isApproved: true,
        vendorProfile: {
          businessName: 'Default Store',
          phone: '9999999999',
          address: '123 Business St, City',
          gstNumber: 'GST123456789',
          registrationNumber: 'REG123456',
          isVerified: true,
        },
      });
      await defaultVendor.save();
      console.log('✅ Created default vendor for seeded products');
    }

    // Get category IDs
    const Electronics = await Category.findOne({ name: 'Electronics' });
    const Mobiles = await Category.findOne({ name: 'Mobiles' });
    const Laptops = await Category.findOne({ name: 'Laptops' });
    const TVs = await Category.findOne({ name: 'TVs' });
    const Furniture = await Category.findOne({ name: 'Furniture' });
    const Chairs = await Category.findOne({ name: 'Chairs' });
    const Tables = await Category.findOne({ name: 'Tables' });
    const Beds = await Category.findOne({ name: 'Beds' });
    const Fashion = await Category.findOne({ name: 'Fashion' });
    const Men = await Category.findOne({ name: 'Men' });
    const Women = await Category.findOne({ name: 'Women' });
    const Kids = await Category.findOne({ name: 'Kids' });
    const Books = await Category.findOne({ name: 'Books' });
    const Fiction = await Category.findOne({ name: 'Fiction' });
    const NonFiction = await Category.findOne({ name: 'Non-Fiction' });
    const Educational = await Category.findOne({ name: 'Educational' });

    // Clear old products
    await Product.deleteMany({});
    console.log('🗑️  Cleared old products');

    const products = [
      // ===== ELECTRONICS - MOBILES =====
      {
        title: 'iPhone 15 Pro Max',
        description: 'Latest Apple iPhone with A17 Pro chip, 48MP camera, and all-day battery',
        price: 1199,
        images: [{ url: 'https://images.unsplash.com/photo-1694286723533-c3761bda-d84d-a0ca-c7c9-09d0364fdd5f?w=400&q=80' }],
        category: Mobiles._id,
        stock: 50,
        seller: 'Apple Store',
        ratingsAverage: 4.8,
        sku: 'IPHONE15PM001',
      },
      {
        title: 'Samsung Galaxy S24 Ultra',
        description: 'Flagship Samsung with S Pen, Snapdragon 8 Gen 3, and 200MP camera',
        price: 1299,
        images: [{ url: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&q=80' }],
        category: Mobiles._id,
        stock: 45,
        seller: 'Samsung Official',
        ratingsAverage: 4.7,
        sku: 'SAMSUNG24U001',
      },
      {
        title: 'Google Pixel 8 Pro',
        description: 'Premium Google smartphone with AI features, 50MP camera, and Magic Eraser',
        price: 999,
        images: [{ url: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&q=80' }],
        category: Mobiles._id,
        stock: 30,
        seller: 'Google Store',
        ratingsAverage: 4.6,
        sku: 'PIXEL8PRO001',
      },
      {
        title: 'OnePlus 12',
        description: 'Fast charging 100W, Snapdragon 8 Gen 3, AMOLED display',
        price: 799,
        images: [{ url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80' }],
        category: Mobiles._id,
        stock: 40,
        seller: 'OnePlus',
        ratingsAverage: 4.5,
        sku: 'ONEPLUS12001',
      },
      {
        title: 'Xiaomi 14 Ultra',
        description: 'Flagship killer with Leica camera and Snapdragon 8 Gen 3',
        price: 849,
        images: [{ url: 'https://images.unsplash.com/photo-1606933248051-5ce98db0e1c0?w=400&q=80' }],
        category: Mobiles._id,
        stock: 35,
        seller: 'Xiaomi Global',
        ratingsAverage: 4.4,
        sku: 'XIAOMI14U001',
      },

      // ===== ELECTRONICS - LAPTOPS =====
      {
        title: 'MacBook Pro 16" M3 Max',
        description: 'Powerful laptop for professionals with M3 Max, 36GB RAM, 1TB SSD',
        price: 2499,
        images: [{ url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80' }],
        category: Laptops._id,
        stock: 20,
        seller: 'Apple',
        ratingsAverage: 4.9,
        sku: 'MACBOOKPRO16001',
      },
      {
        title: 'Dell XPS 15 OLED',
        description: 'Premium Windows laptop with OLED display, RTX 4090, Intel Core i9',
        price: 1899,
        images: [{ url: 'https://images.unsplash.com/photo-1588872657840-218e73e19b45?w=400&q=80' }],
        category: Laptops._id,
        stock: 25,
        seller: 'Dell',
        ratingsAverage: 4.7,
        sku: 'DELLXPS15001',
      },
      {
        title: 'HP Pavilion 16',
        description: 'Great value gaming laptop with RTX 4070, Intel i7, 16GB RAM',
        price: 999,
        images: [{ url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80' }],
        category: Laptops._id,
        stock: 30,
        seller: 'HP',
        ratingsAverage: 4.3,
        sku: 'HPPAV16001',
      },
      {
        title: 'ASUS VivoBook 15',
        description: 'Budget-friendly laptop perfect for students, Ryzen 5, 8GB RAM',
        price: 599,
        images: [{ url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80' }],
        category: Laptops._id,
        stock: 50,
        seller: 'ASUS',
        ratingsAverage: 4.2,
        sku: 'ASUSVIVOBOOK001',
      },

      // ===== ELECTRONICS - TVS =====
      {
        title: 'Samsung 65" QLED TV',
        description: '4K QLED TV with Quantum Processor, 120Hz refresh, Smart TV features',
        price: 1499,
        images: [{ url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&q=80' }],
        category: TVs._id,
        stock: 15,
        seller: 'Samsung',
        ratingsAverage: 4.6,
        sku: 'SAMSUNGQLED65001',
      },
      {
        title: 'LG 55" OLED TV',
        description: '4K OLED with Dolby Vision, AI upscaler, ThinQ AI',
        price: 1399,
        images: [{ url: 'https://images.unsplash.com/photo-1567813568918-0c7a233fbf9e?w=400&q=80' }],
        category: TVs._id,
        stock: 18,
        seller: 'LG',
        ratingsAverage: 4.8,
        sku: 'LGOLED55001',
      },

      // ===== FURNITURE - CHAIRS =====
      {
        title: 'Ergonomic Office Chair Pro',
        description: 'High-back ergonomic chair with lumbar support, mesh back, adjustable armrests',
        price: 349,
        images: [{ url: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&q=80' }],
        category: Chairs._id,
        stock: 100,
        seller: 'Furniture Plus',
        ratingsAverage: 4.5,
        sku: 'ERGOCHAIRPRO001',
      },
      {
        title: 'Gaming Chair RGB Premium',
        description: 'Professional gaming chair with LED lights, reclining, premium PU leather',
        price: 449,
        images: [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' }],
        category: Chairs._id,
        stock: 60,
        seller: 'GamerGear',
        ratingsAverage: 4.6,
        sku: 'GAMINGCHAIRRGB001',
      },
      {
        title: 'Mid-Century Accent Chair',
        description: 'Stylish modern accent chair in velvet, perfect for living room',
        price: 299,
        images: [{ url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&q=80' }],
        category: Chairs._id,
        stock: 80,
        seller: 'Modern Furniture',
        ratingsAverage: 4.4,
        sku: 'ACCENTCHAIR001',
      },

      // ===== FURNITURE - TABLES =====
      {
        title: 'Wooden Dining Table (6-seater)',
        description: 'Solid oak wood dining table, perfect for family meals',
        price: 599,
        images: [{ url: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=400&q=80' }],
        category: Tables._id,
        stock: 40,
        seller: 'Furniture Plus',
        ratingsAverage: 4.7,
        sku: 'DININGTABLE6001',
      },
      {
        title: 'Glass Coffee Table',
        description: 'Modern glass top coffee table with steel frame',
        price: 249,
        images: [{ url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80' }],
        category: Tables._id,
        stock: 70,
        seller: 'Modern Furniture',
        ratingsAverage: 4.3,
        sku: 'COFFEETABLE001',
      },

      // ===== FURNITURE - BEDS =====
      {
        title: 'Queen Size Bed Frame',
        description: 'Sturdy queen bed with storage drawers, wood construction',
        price: 799,
        images: [{ url: 'https://images.unsplash.com/photo-1540932239986-310128078ceb?w=400&q=80' }],
        category: Beds._id,
        stock: 30,
        seller: 'Furniture Plus',
        ratingsAverage: 4.6,
        sku: 'QUEENBED001',
      },
      {
        title: 'Memory Foam Mattress',
        description: 'Comfortable memory foam mattress, 10-year warranty',
        price: 699,
        images: [{ url: 'https://images.unsplash.com/photo-1548625149-fc4a63fca3de?w=400&q=80' }],
        category: Beds._id,
        stock: 50,
        seller: 'Sleep Comfort',
        ratingsAverage: 4.8,
        sku: 'MEMORYFOAMMATRESS001',
      },

      // ===== FASHION - MEN =====
      {
        title: "Men's Premium Formal Shirt",
        description: 'Premium cotton formal shirt, perfect for office wear, available in white, blue, black',
        price: 49.99,
        images: [{ url: 'https://images.unsplash.com/photo-1591047990852-258f50dee5fb?w=400&q=80' }],
        category: Men._id,
        stock: 200,
        seller: 'Fashion Hub',
        ratingsAverage: 4.4,
        sku: 'MENSFORMALSHIRT001',
      },
      {
        title: "Men's Slim Fit Jeans",
        description: 'Stylish slim fit denim jeans, comfortable and durable',
        price: 69.99,
        images: [{ url: 'https://images.unsplash.com/photo-1542272604-787c62002397?w=400&q=80' }],
        category: Men._id,
        stock: 150,
        seller: 'Denim Co',
        ratingsAverage: 4.5,
        sku: 'MENSSLIMJEANS001',
      },
      {
        title: "Men's Casual T-Shirt",
        description: 'Comfortable cotton t-shirt for casual wear, multiple colors',
        price: 24.99,
        images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80' }],
        category: Men._id,
        stock: 250,
        seller: 'Fashion Hub',
        ratingsAverage: 4.3,
        sku: 'MENSCASUALTSHIRT001',
      },
      {
        title: "Men's Blazer",
        description: 'Smart blazer for office and formal occasions',
        price: 129.99,
        images: [{ url: 'https://images.unsplash.com/photo-1609048866893-75ce69842454?w=400&q=80' }],
        category: Men._id,
        stock: 80,
        seller: 'Premium Fashion',
        ratingsAverage: 4.6,
        sku: 'MENSBLAZAER001',
      },

      // ===== FASHION - WOMEN =====
      {
        title: "Women's Summer Dress",
        description: 'Light and comfortable summer dress, perfect for beach or casual outings',
        price: 59.99,
        images: [{ url: 'https://images.unsplash.com/photo-1618336753712-d54fb0512a52?w=400&q=80' }],
        category: Women._id,
        stock: 120,
        seller: 'Fashion Hub',
        ratingsAverage: 4.5,
        sku: 'WOMENSUMDRESS001',
      },
      {
        title: "Women's High Waist Jeans",
        description: 'Trendy high waist jeans for a flattering fit',
        price: 74.99,
        images: [{ url: 'https://images.unsplash.com/photo-1542272604-787c62002397?w=400&q=80' }],
        category: Women._id,
        stock: 130,
        seller: 'Denim Co',
        ratingsAverage: 4.4,
        sku: 'WOMENSHIGHJEANS001',
      },
      {
        title: "Women's Blazer",
        description: 'Professional women blazer for work and formal events',
        price: 139.99,
        images: [{ url: 'https://images.unsplash.com/photo-1612303225857-430ec64bafa5?w=400&q=80' }],
        category: Women._id,
        stock: 60,
        seller: 'Premium Fashion',
        ratingsAverage: 4.7,
        sku: 'WOMENSBLAZAER001',
      },

      // ===== FASHION - KIDS =====
      {
        title: "Kids Cartoon T-Shirt",
        description: 'Colorful cartoon t-shirt for kids, soft cotton',
        price: 19.99,
        images: [{ url: 'https://images.unsplash.com/photo-1503919545889-48854d7ee213?w=400&q=80' }],
        category: Kids._id,
        stock: 200,
        seller: 'Kids Fashion',
        ratingsAverage: 4.6,
        sku: 'KIDSCARTOONTS001',
      },
      {
        title: "Kids Denim Jeans",
        description: 'Durable kids jeans, perfect for active play',
        price: 34.99,
        images: [{ url: 'https://images.unsplash.com/photo-1519238263413-b37eef4a36e2?w=400&q=80' }],
        category: Kids._id,
        stock: 180,
        seller: 'Kids Fashion',
        ratingsAverage: 4.5,
        sku: 'KIDSDENIMJEANS001',
      },

      // ===== BOOKS - FICTION =====
      {
        title: 'The Great Gatsby',
        description: 'Classic novel by F. Scott Fitzgerald about the Jazz Age and American Dream',
        price: 12.99,
        images: [{ url: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&q=80' }],
        category: Fiction._id,
        stock: 80,
        seller: 'Book House',
        ratingsAverage: 4.8,
        sku: 'FICTION001',
      },
      {
        title: 'To Kill a Mockingbird',
        description: 'Harper Lee masterpiece about race and morality in the American South',
        price: 14.99,
        images: [{ url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80' }],
        category: Fiction._id,
        stock: 75,
        seller: 'Book House',
        ratingsAverage: 4.9,
        sku: 'FICTION002',
      },
      {
        title: '1984',
        description: 'Dystopian novel by George Orwell about totalitarianism',
        price: 15.99,
        images: [{ url: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&q=80' }],
        category: Fiction._id,
        stock: 70,
        seller: 'Book House',
        ratingsAverage: 4.7,
        sku: 'FICTION003',
      },
      {
        title: 'Pride and Prejudice',
        description: 'Jane Austen romantic novel about love and society',
        price: 11.99,
        images: [{ url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80' }],
        category: Fiction._id,
        stock: 90,
        seller: 'Book House',
        ratingsAverage: 4.8,
        sku: 'FICTION004',
      },

      // ===== BOOKS - NON-FICTION =====
      {
        title: 'Sapiens: A Brief History of Humankind',
        description: 'Yuval Harari explores the history and impact of the human race',
        price: 18.99,
        images: [{ url: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&q=80' }],
        category: NonFiction._id,
        stock: 60,
        seller: 'Book House',
        ratingsAverage: 4.8,
        sku: 'NONFICTION001',
      },
      {
        title: 'Thinking, Fast and Slow',
        description: 'Daniel Kahneman insights into cognitive psychology and decision making',
        price: 17.99,
        images: [{ url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80' }],
        category: NonFiction._id,
        stock: 55,
        seller: 'Book House',
        ratingsAverage: 4.7,
        sku: 'NONFICTION002',
      },
      {
        title: 'Atomic Habits',
        description: 'James Clear guide to building good habits and breaking bad ones',
        price: 16.99,
        images: [{ url: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&q=80' }],
        category: NonFiction._id,
        stock: 100,
        seller: 'Book House',
        ratingsAverage: 4.9,
        sku: 'NONFICTION003',
      },
      {
        title: 'The Lean Startup',
        description: 'Eric Ries revolutionary approach to designing and marketing new products',
        price: 15.99,
        images: [{ url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80' }],
        category: NonFiction._id,
        stock: 50,
        seller: 'Book House',
        ratingsAverage: 4.6,
        sku: 'NONFICTION004',
      },

      // ===== BOOKS - EDUCATIONAL =====
      {
        title: 'Introduction to Algorithms',
        description: 'CLRS comprehensive guide to algorithms and data structures',
        price: 89.99,
        images: [{ url: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&q=80' }],
        category: Educational._id,
        stock: 40,
        seller: 'Tech Books',
        ratingsAverage: 4.7,
        sku: 'EDU001',
      },
      {
        title: 'Clean Code',
        description: 'Robert Martin guide to writing clean, maintainable code',
        price: 42.99,
        images: [{ url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80' }],
        category: Educational._id,
        stock: 70,
        seller: 'Tech Books',
        ratingsAverage: 4.8,
        sku: 'EDU002',
      },
      {
        title: 'The Pragmatic Programmer',
        description: 'Essential guide to becoming a better software developer',
        price: 44.99,
        images: [{ url: 'https://images.unsplash.com/photo-1507842217343-583f7270bfba?w=400&q=80' }],
        category: Educational._id,
        stock: 55,
        seller: 'Tech Books',
        ratingsAverage: 4.9,
        sku: 'EDU003',
      },
      {
        title: 'Design Patterns',
        description: 'Gang of Four classic on reusable object-oriented design',
        price: 54.99,
        images: [{ url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80' }],
        category: Educational._id,
        stock: 35,
        seller: 'Tech Books',
        ratingsAverage: 4.6,
        sku: 'EDU004',
      },
    ];

    const categoryNameById = new Map([
      [String(Mobiles?._id), 'Mobiles'],
      [String(Laptops?._id), 'Laptops'],
      [String(TVs?._id), 'TVs'],
      [String(Chairs?._id), 'Chairs'],
      [String(Tables?._id), 'Tables'],
      [String(Beds?._id), 'Beds'],
      [String(Men?._id), 'Men Fashion'],
      [String(Women?._id), 'Women Fashion'],
      [String(Kids?._id), 'Kids Fashion'],
      [String(Fiction?._id), 'Fiction Books'],
      [String(NonFiction?._id), 'Non Fiction Books'],
      [String(Educational?._id), 'Educational Books'],
    ]);

    const productsWithDynamicImages = products.map((product) => {
      const categoryName = categoryNameById.get(String(product.category)) || '';
      const usdPrice = Number(SEEDED_USD_OVERRIDES[product.sku] ?? product.price ?? 0);
      const inrPrice = Number((usdPrice * SEEDED_USD_TO_INR).toFixed(2));
      return {
        ...product,
        vendor: defaultVendor._id,
        price: inrPrice,
        originalPrice: inrPrice,
        images: [{ url: resolveProductImage(product.title, categoryName) }],
      };
    });

    const created = await Product.insertMany(productsWithDynamicImages);
    console.log(`\n✅ Created ${created.length} products with images!\n`);

    // Display by category
    console.log('📊 Products by Category:');
    
    const mainCategories = [Electronics, Furniture, Fashion, Books];
    for (const cat of mainCategories) {
      const catProducts = await Product.find({ category: cat._id });
      console.log(`\n${cat.name} (${catProducts.length} products)`);
      
      const subCats = await Category.find({ parentCategory: cat._id });
      for (const sub of subCats) {
        const subProducts = await Product.find({ category: sub._id });
        if (subProducts.length > 0) {
          console.log(`  └─ ${sub.name} (${subProducts.length}): ${subProducts.map(p => p.title).join(', ')}`);
        }
      }
    }

    console.log('\n🎉 All products seeded successfully with product images!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeder
connectDB().then(() => {
  seedProducts();
});
