require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mern-ecommerce';
const PRICE_MULTIPLIER = Number(process.env.PRICE_MULTIPLIER || 5);

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

async function run() {
  if (!Number.isFinite(PRICE_MULTIPLIER) || PRICE_MULTIPLIER <= 1) {
    throw new Error('PRICE_MULTIPLIER must be a number greater than 1');
  }

  await mongoose.connect(MONGO_URI);

  const products = await Product.find({}, { _id: 1, price: 1, originalPrice: 1 }).lean();
  if (!products.length) {
    console.log('No products found. Nothing to update.');
    await mongoose.disconnect();
    return;
  }

  const productPriceMap = new Map();
  const productBulkOps = products.map((product) => {
    const nextPrice = roundToTwo(Number(product.price || 0) * PRICE_MULTIPLIER);
    const nextOriginalPrice = product.originalPrice
      ? roundToTwo(Number(product.originalPrice || 0) * PRICE_MULTIPLIER)
      : nextPrice;

    productPriceMap.set(String(product._id), nextPrice);

    return {
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            price: nextPrice,
            originalPrice: nextOriginalPrice,
          },
        },
      },
    };
  });

  if (productBulkOps.length) {
    await Product.bulkWrite(productBulkOps, { ordered: false });
  }

  const carts = await Cart.find({}).lean();
  const cartBulkOps = [];

  for (const cart of carts) {
    let totalPrice = 0;
    const nextItems = (cart.items || []).map((item) => {
      const productId = item?.product ? String(item.product) : null;
      const mappedPrice = productId ? productPriceMap.get(productId) : null;
      const nextPriceAtPurchase = Number.isFinite(mappedPrice)
        ? mappedPrice
        : Number(item.priceAtPurchase || 0);

      totalPrice += nextPriceAtPurchase * Number(item.quantity || 1);

      return {
        ...item,
        priceAtPurchase: roundToTwo(nextPriceAtPurchase),
      };
    });

    cartBulkOps.push({
      updateOne: {
        filter: { _id: cart._id },
        update: {
          $set: {
            items: nextItems,
            totalPrice: roundToTwo(totalPrice),
          },
        },
      },
    });
  }

  if (cartBulkOps.length) {
    await Cart.bulkWrite(cartBulkOps, { ordered: false });
  }

  console.log(`Updated ${products.length} products and synced ${carts.length} carts with multiplier x${PRICE_MULTIPLIER}.`);
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Failed to increase prices:', error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  });
