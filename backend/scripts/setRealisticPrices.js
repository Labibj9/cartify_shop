require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { convertToINR } = require('../services/currencyService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mern-ecommerce';

const USD_PRICE_BY_SKU = {
  IPHONE15PM001: 380,
  SAMSUNG24U001: 420,
  PIXEL8PRO001: 360,
  ONEPLUS12001: 320,
  XIAOMI14U001: 340,

  MACBOOKPRO16001: 1299,
  DELLXPS15001: 1099,
  HPPAV16001: 749,
  ASUSVIVOBOOK001: 499,

  SAMSUNGQLED65001: 899,
  LGOLED55001: 799,

  ERGOCHAIRPRO001: 189,
  GAMINGCHAIRRGB001: 249,
  ACCENTCHAIR001: 159,
  DININGTABLE6001: 399,
  COFFEETABLE001: 179,
  QUEENBED001: 449,
  MEMORYFOAMMATRESS001: 329,

  MENSFORMALSHIRT001: 34.99,
  MENSSLIMJEANS001: 49.99,
  MENSCASUALTSHIRT001: 19.99,
  MENSBLAZAER001: 89.99,
  WOMENSUMDRESS001: 39.99,
  WOMENSHIGHJEANS001: 54.99,
  WOMENSBLAZAER001: 94.99,
  KIDSCARTOONTS001: 12.99,
  KIDSDENIMJEANS001: 24.99,

  FICTION001: 9.99,
  FICTION002: 10.99,
  FICTION003: 11.99,
  FICTION004: 8.99,
  NONFICTION001: 14.99,
  NONFICTION002: 13.99,
  NONFICTION003: 12.99,
  NONFICTION004: 11.99,
  EDU001: 69.99,
  EDU002: 34.99,
  EDU003: 39.99,
  EDU004: 44.99,
};

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

async function run() {
  await mongoose.connect(MONGO_URI);

  const products = await Product.find({}, { _id: 1, sku: 1, title: 1, price: 1 }).lean();
  const updates = [];
  const productPriceById = new Map();
  let updatedProducts = 0;

  for (const product of products) {
    const usd = USD_PRICE_BY_SKU[product.sku];
    if (!Number.isFinite(usd)) continue;

    const inr = round2(await convertToINR(usd, 'USD'));
    productPriceById.set(String(product._id), inr);

    updates.push({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            price: inr,
            originalPrice: inr,
          },
        },
      },
    });
    updatedProducts += 1;
  }

  if (updates.length) {
    await Product.bulkWrite(updates, { ordered: false });
  }

  const carts = await Cart.find({}).lean();
  const cartUpdates = [];

  for (const cart of carts) {
    let total = 0;
    const items = (cart.items || []).map((item) => {
      const productId = String(item.product);
      const priceAtPurchase = productPriceById.get(productId) ?? Number(item.priceAtPurchase || 0);
      total += priceAtPurchase * Number(item.quantity || 1);
      return {
        ...item,
        priceAtPurchase: round2(priceAtPurchase),
      };
    });

    cartUpdates.push({
      updateOne: {
        filter: { _id: cart._id },
        update: {
          $set: {
            items,
            totalPrice: round2(total),
          },
        },
      },
    });
  }

  if (cartUpdates.length) {
    await Cart.bulkWrite(cartUpdates, { ordered: false });
  }

  console.log(`Set realistic prices for ${updatedProducts} products (USD benchmark), synced ${carts.length} carts.`);
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Failed to set realistic prices:', error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  });
