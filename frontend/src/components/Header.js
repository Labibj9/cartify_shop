import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authService, wishlistService } from '../services/api';
import { logout } from '../redux/authSlice';
import { setWishlist, clearWishlist } from '../redux/wishlistSlice';
import { setCurrency } from '../redux/currencySlice';
import { SUPPORTED_CURRENCIES } from '../utils/currency';

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { selectedCurrency } = useSelector((state) => state.currency);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const { cart } = useSelector((state) => state.cart);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) {
        dispatch(clearWishlist());
        return;
      }

      try {
        const res = await wishlistService.getWishlist();
        const products = (res.data?.wishlist?.items || []).map((item) => item.product).filter(Boolean);
        dispatch(setWishlist(products));
      } catch (err) {
        console.error('Failed to fetch wishlist in header', err);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, dispatch]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      dispatch(clearWishlist());
      setShowUserMenu(false);
      localStorage.removeItem('token');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(searchInput)}`);
  };

  const handleCurrencyChange = (e) => {
    dispatch(setCurrency(e.target.value));
  };

  return (
    <header className="sticky top-0 z-50 bg-amazon-blue text-white shadow-lg w-full">
      {/* Top Navigation Bar */}
      <div className="px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4 justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center whitespace-nowrap hover:opacity-70 transition">
            <span className="text-2xl font-bold" aria-hidden="true">C</span>
            <span className="text-lg font-semibold ml-2">Cartify</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 flex bg-white rounded-md overflow-hidden">
            <select className="px-3 py-2 text-amazon-blue bg-amazon-light border-r border-gray-300 text-xs font-semibold focus:outline-none">
              <option>All</option>
              <option>Electronics</option>
              <option>Books</option>
              <option>Clothing</option>
            </select>
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 px-3 py-2 text-gray-700 focus:outline-none text-sm"
            />
            <button
              type="submit"
              aria-label="Search products"
              className="bg-amazon-orange hover:bg-orange-600 px-4 py-2 text-amazon-blue font-bold transition"
            >
              Search
            </button>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-300">Currency</span>
              <select
                value={selectedCurrency}
                onChange={handleCurrencyChange}
                className="bg-white text-amazon-blue text-xs font-semibold px-2 py-1 rounded border border-gray-300 focus:outline-none"
              >
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            {/* User Account */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="text-xs font-semibold hover:text-amazon-orange transition"
              >
                <span className="block text-xs text-gray-300">Hello, {isAuthenticated ? user?.name?.split(' ')[0] : 'Sign in'}</span>
                <span className="flex items-center gap-1">Account & Lists <span aria-hidden="true">v</span></span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-amazon-blue rounded-md shadow-xl py-2 z-10">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold">{user?.name}</p>
                        <p className="text-xs text-gray-600">{user?.email}</p>
                      </div>
                      <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                        Your Orders
                      </Link>
                      {user?.role === 'vendor' && user?.isApproved && (
                        <Link to="/vendor" className="block px-4 py-2 hover:bg-gray-100 text-sm font-semibold text-orange-600">
                          Vendor Dashboard
                        </Link>
                      )}
                      {user?.role === 'vendor' && !user?.isApproved && (
                        <div className="block px-4 py-2 text-xs text-amber-700 bg-amber-50">
                          Vendor account pending admin approval
                        </div>
                      )}
                      {user?.role === 'admin' && (
                        <Link to="/admin/dashboard" className="block px-4 py-2 hover:bg-gray-100 text-sm font-semibold text-orange-600">
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-t border-gray-200"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                        Sign In
                      </Link>
                      <Link to="/register" className="block px-4 py-2 hover:bg-gray-100 text-sm">
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Cart Icon */}
            <Link to="/cart" className="relative hover:text-amazon-orange transition">
              <span className="text-sm font-semibold">Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-amazon-orange text-amazon-blue text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Wishlist Icon */}
            <Link to="/wishlist" className="relative hover:text-amazon-orange transition">
              <span className="text-sm font-semibold">Wishlist</span>
              {wishlistItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Navigation */}
      <div className="bg-amazon-blue border-t border-gray-700 px-4 text-xs text-gray-200">
        <div className="max-w-7xl mx-auto flex items-center gap-4 py-2 overflow-x-auto">
          <Link to="/products" className="hover:text-amazon-orange whitespace-nowrap transition">
            All Products
          </Link>
          <span className="text-gray-600">|</span>
          <Link to="/products" className="hover:text-amazon-orange whitespace-nowrap transition">
            Best Sellers
          </Link>
          <span className="text-gray-600">|</span>
          <Link to="/products" className="hover:text-amazon-orange whitespace-nowrap transition">
            Deals
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
