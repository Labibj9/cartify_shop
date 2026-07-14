import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { wishlistService, cartService } from '../services/api';
import { setWishlist, removeWishlistItem } from '../redux/wishlistSlice';
import { addItem } from '../redux/cartSlice';
import Toast from '../components/Toast';
import { getProductImageUrl, getProductImageWithFallback } from '../utils/productImage';
import { formatPrice } from '../utils/currency';

function Wishlist() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { selectedCurrency } = useSelector((state) => state.currency);
  const items = useSelector((state) => state.wishlist.items);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 2200);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadWishlist = async () => {
      try {
        const res = await wishlistService.getWishlist();
        const products = (res.data?.wishlist?.items || [])
          .map((entry) => entry.product)
          .filter(Boolean);
        dispatch(setWishlist(products));
      } catch (err) {
        setToast({
          message: err.response?.data?.message || 'Failed to fetch wishlist',
          type: 'error',
        });
        setTimeout(() => setToast({ message: '', type: 'success' }), 2200);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [dispatch, isAuthenticated, navigate, selectedCurrency]);

  const handleAddToCart = async (product) => {
    try {
      await cartService.addToCart(product._id, 1);
      dispatch(addItem({ productId: product._id, quantity: 1, ...product }));
      showToast('Added to cart');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add to cart', 'error');
    }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      dispatch(removeWishlistItem(productId));
      showToast('Removed from wishlist');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove from wishlist', 'error');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-amazon-light py-8">
      <Toast message={toast.message} type={toast.type} />
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-amazon-blue mb-8">Your Wishlist</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <h2 className="text-2xl font-semibold text-amazon-blue mb-3">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Save items you love and buy them later.</p>
            <Link to="/products" className="bg-amazon-orange text-white px-6 py-3 rounded font-bold hover:bg-orange-600">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <Link to={`/products/${product._id}`}>
                  <div className="w-full h-48 bg-gray-100">
                    <img
                      src={getProductImageUrl(product)}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => getProductImageWithFallback(e, product)}
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product._id}`} className="font-semibold text-gray-800 line-clamp-2 hover:text-amazon-blue">
                    {product.title}
                  </Link>
                  <p className="text-amazon-orange font-bold text-lg mt-2">{formatPrice(product.price, selectedCurrency)}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 bg-amazon-orange hover:bg-orange-600 text-white text-sm py-2 rounded font-semibold"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="flex-1 border border-red-500 text-red-600 hover:bg-red-50 text-sm py-2 rounded font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;
