import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { cartService } from '../services/api';
import { setCart, updateQuantity, removeItem } from '../redux/cartSlice';
import { getProductImageUrl, getProductImageWithFallback } from '../utils/productImage';
import { formatPrice } from '../utils/currency';

function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { selectedCurrency } = useSelector((state) => state.currency);
  const [loading, setLoading] = useState(true);

  const cartItems = items || [];
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      // Fetch cart from database on page load
      const fetchCart = async () => {
        try {
          console.log('📦 Fetching cart from database...');
          const response = await cartService.getCart();
          console.log('✅ Cart from DB:', response.data.cart);
          
          // Map database cart items to Redux format
          if (response.data.cart && response.data.cart.items) {
            const formattedItems = response.data.cart.items
              .map((item) => {
                const productObj = item.product && typeof item.product === 'object' ? item.product : null;
                const productId = productObj?._id || item.product || item.productId || null;

                if (!productId) return null;

                const title = item.title || productObj?.title || 'Product';
                const price = Number(item.priceAtPurchase ?? item.price ?? productObj?.price ?? 0);
                const image = item.image || productObj?.image || productObj?.images?.[0]?.url || '';

                return {
                  productId,
                  title,
                  price,
                  priceAtPurchase: price,
                  quantity: Number(item.quantity || 1),
                  image,
                  images: image ? [{ url: image }] : [],
                  product: item.product,
                };
              })
              .filter(Boolean);

            dispatch(setCart(formattedItems));
          }
        } catch (err) {
          console.error('❌ Error fetching cart:', err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchCart();
    }
  }, [isAuthenticated, navigate, dispatch, selectedCurrency]);

  const handleUpdateQuantity = async (productId, quantity) => {
    if (quantity > 0) {
      await cartService.updateCart(productId, quantity);
      dispatch(updateQuantity({ productId, quantity }));
    }
  };

  const handleRemoveItem = async (productId) => {
    await cartService.removeFromCart(productId);
    dispatch(removeItem(productId));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-amazon-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amazon-blue mb-4">Your Cart is Empty</h1>
          <button onClick={() => navigate('/products')} className="bg-amazon-orange text-white px-6 py-3 rounded font-bold hover:bg-orange-600">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amazon-light py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-amazon-blue mb-8">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex gap-4 border-b pb-4 mb-4">
                <img
                  src={getProductImageUrl(item)}
                  alt={item.title}
                  className="w-24 h-24 object-cover rounded"
                  onError={(e) => getProductImageWithFallback(e, item)}
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-amazon-orange font-bold">{formatPrice(item.price, selectedCurrency)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)} className="px-2 py-1 border rounded">-</button>
                    <span className="px-4">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)} className="px-2 py-1 border rounded">+</button>
                  </div>
                </div>
                <button onClick={() => handleRemoveItem(item.productId)} className="text-red-600 font-bold hover:text-red-800">Remove</button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
            <h2 className="text-2xl font-bold text-amazon-blue mb-4">Order Summary</h2>
            <div className="flex justify-between mb-4 border-b pb-4">
              <span>Subtotal:</span>
              <span className="font-bold">{formatPrice(total, selectedCurrency)}</span>
            </div>
            <div className="flex justify-between mb-4 border-b pb-4">
              <span>Shipping:</span>
              <span className="font-bold text-green-600">FREE</span>
            </div>
            <div className="flex justify-between mb-6 text-xl font-bold">
              <span>Total:</span>
              <span className="text-amazon-orange">{formatPrice(total, selectedCurrency)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-amazon-orange hover:bg-orange-600 text-white font-bold py-3 rounded text-lg transition"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
