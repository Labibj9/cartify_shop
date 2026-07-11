import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderSuccess from './pages/OrderSuccess';
import Wishlist from './pages/Wishlist';
import LoginSelector from './pages/LoginSelector';
import CustomerLogin from './pages/CustomerLogin';
import VendorLogin from './pages/VendorLogin';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';

// Admin Components
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVendors from './pages/admin/AdminVendors';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';

import VendorLayout from './pages/vendor/VendorLayout';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorReports from './pages/vendor/VendorReports';
import VendorReviews from './pages/vendor/VendorReviews';
import VendorOperations from './pages/vendor/VendorOperations';
import VendorProfile from './pages/vendor/VendorProfile';

import { authService } from './services/api';
import { setAuth } from './redux/authSlice';

const PublicLayout = () => (
  <>
    <Header />
    <Outlet />
  </>
);

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await authService.getProfile();
          dispatch(setAuth({ user: res.data.user }));
        }
      } catch (err) {
        console.error('Auth check failed', err);
      }
    };
    checkAuth();
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public routes with Header */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute role="user">
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute role="user">
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-success"
            element={
              <ProtectedRoute role="user">
                <OrderSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute role="user">
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginSelector />} />
          <Route path="/login/customer" element={<CustomerLogin />} />
          <Route path="/login/vendor" element={<VendorLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="vendors" element={<AdminVendors />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="categories" element={<AdminCategories />} />
        </Route>

        {/* Vendor Routes */}
        <Route
          path="/vendor"
          element={
            <ProtectedRoute role="vendor" requireApproved>
              <VendorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="" element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<VendorDashboard />} />
          <Route path="products" element={<VendorProducts />} />
          <Route path="orders" element={<VendorOrders />} />
          <Route path="reports" element={<VendorReports />} />
          <Route path="operations" element={<VendorOperations />} />
          <Route path="reviews" element={<VendorReviews />} />
          <Route path="profile" element={<VendorProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
