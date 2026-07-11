const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { BASE_CURRENCY, normalizeCurrency, convertPrice } = require('../services/currencyService');

// Get cart
exports.getCart = async (req, res) => {
  try {
    const targetCurrency = normalizeCurrency(req.query.currency || BASE_CURRENCY);
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) {
      const newCart = new Cart({ user: req.user.id, items: [], total: 0 });
      await newCart.save();
      return res.json({ success: true, cart: newCart, currency: targetCurrency });
    }

    const cartObj = cart.toObject();
    cartObj.items = await Promise.all(
      cartObj.items.map(async (item) => ({
        ...item,
        originalPriceAtPurchase: item.priceAtPurchase,
        priceAtPurchase: await convertPrice(item.priceAtPurchase, targetCurrency),
        currency: targetCurrency,
      }))
    );
    cartObj.totalPrice = await convertPrice(cart.totalPrice, targetCurrency);

    res.json({ success: true, cart: cartObj, currency: targetCurrency });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    console.log('🛒 Add to Cart Request:', { productId, quantity, userId: req.user?.id });
    
    // Validate input
    if (!productId || !quantity || quantity < 1) {
      console.log('❌ Validation failed: Invalid product ID or quantity');
      return res.status(400).json({ success: false, message: 'Invalid product ID or quantity' });
    }

    const product = await Product.findById(productId);
    console.log('📦 Product found:', product ? `${product.title} (Stock: ${product.stock})` : 'NOT FOUND');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check stock
    if (product.stock < quantity) {
      console.log(`❌ Stock check failed: Need ${quantity}, Available: ${product.stock}`);
      return res.status(400).json({ success: false, message: `Only ${product.stock} items available` });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      console.log('📝 Creating new cart for user');
      cart = new Cart({ user: req.user.id, items: [] });
    } else {
      console.log(`📊 Found existing cart with ${cart.items.length} items`);
      
      // Fix existing items that might be missing prices
      for (let item of cart.items) {
        if (!item.priceAtPurchase || item.priceAtPurchase === 0) {
          const existingProduct = await Product.findById(item.product);
          if (existingProduct) {
            item.priceAtPurchase = existingProduct.price;
            item.image = existingProduct.images?.[0]?.url || '';
            item.title = existingProduct.title;
            console.log(`🔧 Fixed missing price for product: ${existingProduct.title}`);
          }
        }
      }
    }

    // Check if item already in cart
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[itemIndex].quantity + quantity;
      console.log(`📈 Updating existing item: ${cart.items[itemIndex].quantity} → ${newQuantity}`);
      if (product.stock < newQuantity) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} items available` });
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      // Add new item
      console.log(`➕ Adding new item to cart`);
      const imageUrl = product.images && product.images[0] ? product.images[0].url : '';
      cart.items.push({
        product: productId,
        quantity,
        priceAtPurchase: product.price,
        image: imageUrl,
        title: product.title,
      });
    }

    await cart.save();
    console.log('✅ Cart saved successfully');
    const populatedCart = await cart.populate('items.product');
    
    res.json({ success: true, message: 'Item added to cart', cart: populatedCart });
  } catch (err) {
    console.error('❌ Error in addToCart:', err.message, err.stack);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update cart item quantity
exports.updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Invalid product ID or quantity' });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0
      cart.items.splice(itemIndex, 1);
    } else {
      // Check product stock
      const product = await Product.findById(productId);
      if (product.stock < quantity) {
        return res.status(400).json({ success: false, message: `Only ${product.stock} items available` });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();
    const populatedCart = await cart.populate('items.product');
    res.json({ success: true, message: 'Cart updated', cart: populatedCart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID required' });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();
    const populatedCart = await cart.populate('items.product');
    
    res.json({ success: true, message: 'Item removed from cart', cart: populatedCart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = [];
    await cart.save();
    
    res.json({ success: true, message: 'Cart cleared', cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
