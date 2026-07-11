import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { productService, cartService, wishlistService } from '../services/api';
import { addItem } from '../redux/cartSlice';
import { addWishlistItem, removeWishlistItem, setWishlist } from '../redux/wishlistSlice';
import Toast from '../components/Toast';
import { getProductImageUrl, getProductImageWithFallback } from '../utils/productImage';
import { formatPrice } from '../utils/currency';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { selectedCurrency } = useSelector((state) => state.currency);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [userReview, setUserReview] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productService.getProductById(id);
        setProduct(res.data.product);
      } catch (err) {
        console.error('Failed to fetch product', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, selectedCurrency]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await wishlistService.getWishlist();
        const products = (res.data?.wishlist?.items || []).map((entry) => entry.product).filter(Boolean);
        dispatch(setWishlist(products));
      } catch (err) {
        console.error('Failed to fetch wishlist', err);
      }
    };
    fetchWishlist();
  }, [isAuthenticated, dispatch]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 2200);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Please login first to add items to cart');
      navigate('/login');
      return;
    }
    
    console.log('🛒 Frontend: Starting Add to Cart...');
    console.log('📦 Product:', { id: product._id, title: product.title, price: product.price });
    console.log('🔢 Quantity:', quantity);
    
    try {
      console.log('🌐 Sending request to API...');
      const response = await cartService.addToCart(product._id, quantity);
      console.log('✅ Success Response:', response);
      
      dispatch(addItem({ productId: product._id, quantity, ...product }));
      showToast('Added to cart');
    } catch (err) {
      console.error('❌ Failed to add to cart:', err);
      console.error('Error Response:', err.response?.data);
      showToast(err.response?.data?.message || err.message || 'Failed to add to cart', 'error');
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      alert('Please login first to add items to wishlist');
      navigate('/login');
      return;
    }

    try {
      const isWishlisted = wishlistItems.some((item) => item._id === product._id);
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(product._id);
        dispatch(removeWishlistItem(product._id));
        showToast('Removed from wishlist');
      } else {
        await wishlistService.addToWishlist(product._id);
        dispatch(addWishlistItem(product));
        showToast('Added to wishlist');
      }
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      showToast(err.response?.data?.message || err.message || 'Failed to update wishlist', 'error');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!userReview.comment.trim()) {
      setReviewError('Please write a comment');
      return;
    }
    try {
      setSubmittingReview(true);
      setReviewError('');
      await productService.addReview(product._id, {
        rating: Number(userReview.rating),
        title: userReview.title,
        comment: userReview.comment,
      });
      showToast('Review submitted');
      setUserReview({ rating: 5, title: '', comment: '' });
      const res = await productService.getProductById(product._id);
      setProduct(res.data.product);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center">Product not found</div>;

  return (
    <div className="min-h-screen bg-amazon-light py-8">
      <Toast message={toast.message} type={toast.type} />
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <img
              src={getProductImageUrl(product)}
              alt={product.title}
              className="w-full h-auto rounded"
              onError={(e) => getProductImageWithFallback(e, product)}
            />
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-amazon-blue mb-4">{product.title}</h1>
            
            {/* Rating */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.round(product.ratingsAverage || 0) ? 'text-yellow-400 text-2xl' : 'text-gray-300 text-2xl'}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-600">({product.ratingsCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-bold text-amazon-orange">{formatPrice(product.price, selectedCurrency)}</span>
              {product.originalPrice && <span className="text-xl text-gray-500 line-through ml-4">{formatPrice(product.originalPrice, selectedCurrency)}</span>}
              {product.discount > 0 && <span className="text-lg text-green-600 font-semibold ml-4">{product.discount}% off</span>}
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6 text-lg">{product.description}</p>

            {/* Stock Status */}
            <div className="mb-6">
              <span className={`text-lg font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Quantity & Action Buttons */}
            <div className="flex gap-4 mb-6">
              <div className="flex items-center border border-gray-300 rounded">
                <button onClick={() => quantity > 1 && setQuantity(quantity - 1)} className="px-4 py-2">-</button>
                <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} className="w-12 text-center border-l border-r" />
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 py-3 rounded text-lg font-bold transition ${
                  product.stock === 0
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-amazon-orange hover:bg-orange-600 text-white'
                }`}
              >
                Add to Cart
              </button>
              <button 
                onClick={handleAddToWishlist}
                className={`px-6 py-3 border-2 rounded font-bold transition ${
                  wishlistItems.some((item) => item._id === product._id)
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-amazon-orange text-amazon-orange hover:bg-blue-50'
                }`}
              >
                {wishlistItems.some((item) => item._id === product._id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-10 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-amazon-blue mb-4">Customer Reviews</h2>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex text-2xl">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.round(product.ratingsAverage || 0) ? 'text-yellow-400' : 'text-gray-300'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-gray-600">
              {(product.ratingsAverage || 0).toFixed(1)} ({product.ratingsCount || 0} reviews)
            </span>
          </div>

          {isAuthenticated ? (
            <form onSubmit={handleSubmitReview} className="mb-8 border-t border-gray-100 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Write a review</h3>
              {reviewError && <p className="text-red-600 text-sm mb-2">{reviewError}</p>}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm text-gray-600">Rating:</span>
                <select
                  value={userReview.rating}
                  onChange={(e) => setUserReview({ ...userReview, rating: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} ★
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={userReview.title}
                onChange={(e) => setUserReview({ ...userReview, title: e.target.value })}
                placeholder="Review title (optional)"
                className="w-full mb-3 border border-gray-300 rounded px-3 py-2"
              />
              <textarea
                value={userReview.comment}
                onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                placeholder="Share your experience..."
                rows="3"
                className="w-full mb-3 border border-gray-300 rounded px-3 py-2"
                required
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="rounded-lg bg-amazon-blue px-4 py-2 text-white disabled:opacity-60"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          ) : (
            <p className="mb-8 text-sm text-gray-500 border-t border-gray-100 pt-6">
              Please <span className="text-amazon-blue font-medium cursor-pointer" onClick={() => navigate('/login')}>log in</span> to write a review.
            </p>
          )}

          <div className="space-y-4">
            {(product.reviews || []).length === 0 ? (
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            ) : (
              product.reviews.map((rev) => (
                <div key={rev._id} className="border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < (rev.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="font-semibold text-gray-800">{rev.user?.name || 'Customer'}</span>
                  </div>
                  {rev.title && <p className="font-medium text-gray-800 mt-1">{rev.title}</p>}
                  {rev.comment && <p className="text-gray-600 mt-1 text-sm">{rev.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
