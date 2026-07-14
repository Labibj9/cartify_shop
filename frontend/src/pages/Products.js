import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { productService, cartService, wishlistService } from '../services/api';
import { addItem } from '../redux/cartSlice';
import { setWishlist, addWishlistItem, removeWishlistItem } from '../redux/wishlistSlice';
import NestedCategoryFilter from '../components/NestedCategoryFilter';
import Toast from '../components/Toast';
import { getProductImageUrl, getProductImageWithFallback } from '../utils/productImage';
import { formatPrice } from '../utils/currency';

function Products() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { selectedCurrency } = useSelector((state) => state.currency);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const limit = 12;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const filters = {
          search: searchParams.get('search') || '',
          category: searchParams.get('category') || '',
          minPrice: searchParams.get('minPrice') || '',
          maxPrice: searchParams.get('maxPrice') || '',
          sort: searchParams.get('sort') || '',
        };
        const res = await productService.getProducts(page, limit, filters);
        setProducts(res.data.products);
        setTotal(res.data.total);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, page, selectedCurrency]);

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

  const handleFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setPage(1);
    setSearchParams(newParams);
  };

  const handleCategorySelect = (categoryId) => {
    if (categoryId) {
      handleFilter('category', categoryId);
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('category');
      setPage(1);
      setSearchParams(newParams);
    }
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await cartService.addToCart(product._id, 1);
      dispatch(addItem({ productId: product._id, quantity: 1, ...product }));
      showToast('Added to cart');
    } catch (err) {
      console.error('Failed to add to cart', err);
      showToast(err.response?.data?.message || 'Failed to add to cart', 'error');
    }
  };

  const handleWishlistToggle = async (e, product) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const isWishlisted = wishlistItems.some((item) => item._id === product._id);

    try {
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
      console.error('Failed to toggle wishlist', err);
      showToast(err.response?.data?.message || 'Failed to update wishlist', 'error');
    }
  };

  const handlePriceFilter = () => {
    if (minPrice || maxPrice) {
      const newParams = new URLSearchParams(searchParams);
      if (minPrice) newParams.set('minPrice', minPrice);
      else newParams.delete('minPrice');
      if (maxPrice) newParams.set('maxPrice', maxPrice);
      else newParams.delete('maxPrice');
      setPage(1);
      setSearchParams(newParams);
    }
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSearchParams('');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <Toast message={toast.message} type={toast.type} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_200px_minmax(0,1fr)] gap-6">
          {/* Nested Category Filter Component */}
          <NestedCategoryFilter
            selectedCategory={searchParams.get('category') || null}
            onCategorySelect={handleCategorySelect}
            onClearFilters={handleClearFilters}
          />

          {/* Right Sidebar - Price and Sort Filters */}
          <div className="w-full lg:w-48 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sticky top-24">
              <h2 className="text-lg font-bold text-amazon-blue mb-4 border-b-2 pb-2">Filters</h2>

              {/* Price Range Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Price Range</h3>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                  />
                  <input
                    type="number"
                    placeholder="Max price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                  />
                  <button
                    onClick={handlePriceFilter}
                    className="w-full bg-amazon-orange hover:bg-orange-600 text-white font-semibold py-2 rounded-md transition text-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Sort Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Sort By</h3>
                <select
                  onChange={(e) => handleFilter('sort', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                >
                  <option value="">Latest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* Clear All Filters Button */}
              <button
                onClick={handleClearFilters}
                className="w-full border-2 border-amazon-blue text-amazon-blue hover:bg-blue-50 font-semibold py-2 rounded-md transition text-sm"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-6 bg-white rounded-xl shadow-md border border-gray-100 p-5">
              <h1 className="text-3xl font-bold text-amazon-blue mb-2 tracking-tight">
                {searchParams.get('search') ? `Search: "${searchParams.get('search')}"` : 'All Products'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
                  Showing {products.length > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, total)} of {total} products
                </span>
                {searchParams.get('category') && (
                  <span className="bg-blue-50 text-amazon-blue px-3 py-1 rounded-full font-medium">Category Filter Applied</span>
                )}
                {(searchParams.get('minPrice') || searchParams.get('maxPrice')) && (
                  <span className="bg-orange-50 text-amazon-orange px-3 py-1 rounded-full font-medium">Price Filter Applied</span>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-gray-300"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-300 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                  {products.map((product) => (
                    <Link 
                      to={`/products/${product._id}`} 
                      key={product._id}
                      className="no-underline"
                    >
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col group cursor-pointer">
                        {/* Image Container */}
                        <div className="relative w-full h-48 bg-amazon-light overflow-hidden">
                          <img
                            src={getProductImageUrl(product)}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => getProductImageWithFallback(e, product)}
                          />
                          {product.discount > 0 && (
                            <div className="absolute top-2 right-2 bg-amazon-orange text-white px-2 py-1 rounded text-xs font-bold">
                              -{product.discount}%
                            </div>
                          )}
                          {product.stock === 0 && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">Out of Stock</span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 flex flex-col">
                          {/* Title */}
                          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-amazon-blue transition-colors">
                            {product.title}
                          </h3>

                          {/* Rating */}
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < Math.round(product.ratingsAverage || 0) ? 'text-yellow-400' : 'text-gray-300'}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-600">({product.ratingsCount || 0})</span>
                          </div>

                          {/* Price */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-amazon-orange">{formatPrice(product.price, selectedCurrency)}</span>
                              {product.originalPrice && (
                                <span className="text-sm text-gray-500 line-through">{formatPrice(product.originalPrice, selectedCurrency)}</span>
                              )}
                            </div>
                          </div>

                          {/* Stock Status */}
                          <div className="mb-3">
                            <span className={`text-xs font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {product.stock > 0 ? '✓ In Stock' : 'Out of stock'}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-auto pt-2 border-t">
                            <button
                              onClick={(e) => handleAddToCart(e, product)}
                              disabled={product.stock === 0}
                              className={`flex-1 py-2 rounded-md text-xs font-semibold transition ${
                                product.stock === 0
                                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                  : 'bg-amazon-orange hover:bg-orange-600 text-white'
                              }`}
                            >
                              🛒 Add
                            </button>
                            <button
                              onClick={(e) => handleWishlistToggle(e, product)}
                              className={`flex-1 py-2 rounded-md text-xs font-semibold border transition ${
                                wishlistItems.some((item) => item._id === product._id)
                                  ? 'border-red-500 text-red-600 bg-red-50'
                                  : 'border-amazon-orange text-amazon-orange hover:bg-orange-50'
                              }`}
                            >
                              {wishlistItems.some((item) => item._id === product._id) ? '❤️' : '🤍'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 py-8 border-t pt-8">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className={`px-4 py-2 rounded font-semibold transition ${
                        page <= 1
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-amazon-blue text-white hover:bg-blue-900'
                      }`}
                    >
                      ← Previous
                    </button>
                    
                    <div className="flex items-center gap-2">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-3 py-2 rounded font-semibold transition ${
                              page === pageNum
                                ? 'bg-amazon-orange text-white'
                                : 'bg-white border border-gray-300 text-amazon-blue hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className={`px-4 py-2 rounded font-semibold transition ${
                        page >= totalPages
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-amazon-blue text-white hover:bg-blue-900'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
                <p className="text-xl text-gray-600 mb-4">No products found</p>
                <Link to="/products" className="text-amazon-orange hover:text-orange-600 font-semibold">
                  Browse all products
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Products;
