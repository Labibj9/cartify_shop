import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const selectedCurrency = localStorage.getItem('currency') || 'INR';
    if (selectedCurrency) {
      const method = (config.method || 'get').toLowerCase();
      const shouldAttachCurrency =
        method === 'get' ||
        (method === 'post' && config.url?.includes('/orders/create'));

      if (shouldAttachCurrency) {
        if (method === 'get') {
          config.params = {
            ...(config.params || {}),
            currency: selectedCurrency,
          };
        } else if (method === 'post' && config.url?.includes('/orders/create')) {
          config.data = {
            ...(config.data || {}),
            currency: selectedCurrency,
          };
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      const isProfileCheck = error.config?.url?.includes('/auth/profile');
      const isLoginPage = window.location.pathname.startsWith('/login');

      if (!isProfileCheck && !isLoginPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Product Service
export const productService = {
  getProducts: (page = 1, limit = 12, filters = {}) =>
    api.get('/products', { params: { page, limit, ...filters } }),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  addReview: (productId, data) => api.post(`/products/${productId}/reviews`, data),
};

// Category Service
export const categoryService = {
  // Public endpoints - nested tree structure
  getCategories: () => api.get('/categories'),
  getCategoryBySlug: (slug) => api.get(`/categories/slug/${slug}`),
  getCategoryById: (id) => api.get(`/categories/id/${id}`),
  getSubcategories: (parentId) => api.get(`/categories/${parentId}/subcategories`),

  // Admin endpoints
  getAllCategoriesFlat: () => api.get('/categories/admin/list/all'),
  getFullCategoryTree: () => api.get('/categories/admin/tree/full'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Cart Service
export const cartService = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart/add', { productId, quantity }),
  updateCart: (productId, quantity) => api.put('/cart/update', { productId, quantity }),
  removeFromCart: (productId) => api.delete(`/cart/remove/${productId}`),
  clearCart: () => api.delete('/cart/clear'),
};

// Order Service
export const orderService = {
  createOrder: (data) => api.post('/orders/create', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getUserOrders: () => api.get('/orders/my-orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  updatePaymentStatus: (id, paymentStatus) => api.put(`/orders/${id}/payment-status`, { paymentStatus }),
};

// Payment Service
export const paymentService = {
  createPaymentOrder: (data) => api.post('/payment/create-order', data),
  processPayment: (data) => api.post('/payment/process', data),
  verifyPayment: (data) => api.post('/payment/verify', data),
  getPaymentStatus: (paymentId) => api.get(`/payment/status/${paymentId}`),
  createPayPalOrder: (data) => api.post('/payment/paypal/create-order', data),
  capturePayPalOrder: (data) => api.post('/payment/paypal/capture-order', data),
  createUpiOrder: (data) => api.post('/payment/upi/create-order', data),
  verifyUpiPayment: (data) => api.post('/payment/upi/verify', data),
};

// User Service
export const userService = {
  addToWishlist: (productId) => api.post('/users/wishlist/add', { productId }),
  removeFromWishlist: (productId) => api.delete(`/users/wishlist/${productId}`),
  getWishlist: () => api.get('/users/wishlist'),
  addAddress: (data) => api.post('/users/address', data),
};

// Wishlist Service (dedicated routes)
export const wishlistService = {
  addToWishlist: (productId) => api.post(`/wishlist/add/${productId}`),
  removeFromWishlist: (productId) => api.delete(`/wishlist/remove/${productId}`),
  getWishlist: () => api.get('/wishlist'),
};

// Admin Service
export const adminService = {
  // Dashboard
  getAdminDashboardStats: () => api.get('/admin/stats'),
  getDashboardStats: () => api.get('/admin/stats'),
  
  // General Admin
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getAllOrders: (params) => api.get('/orders/admin/all-orders', { params }),
  
  // Vendor Management
  getVendors: (params) => api.get('/admin/vendors', { params }),
  createVendor: (data) => api.post('/admin/vendors', data),
  getVendorDetails: (vendorId) => api.get(`/admin/vendors/${vendorId}`),
  approveVendor: (vendorId, data) => api.put(`/admin/vendors/${vendorId}/approve`, data),
  rejectVendor: (vendorId, data) => api.put(`/admin/vendors/${vendorId}/reject`, data),
  verifyVendor: (vendorId) => api.put(`/admin/vendors/${vendorId}/verify`),
  deleteVendor: (vendorId) => api.delete(`/admin/vendors/${vendorId}`),
  
  // Product Management
  getAllProducts: (params) => api.get('/admin/products-management', { params }),
  getProductsByVendor: (vendorId, params) => api.get(`/admin/products-management/vendor/${vendorId}`, { params }),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  blockProduct: (productId, data) => api.put(`/admin/products-management/${productId}/block`, data),
  unblockProduct: (productId) => api.put(`/admin/products-management/${productId}/unblock`),
  deleteProduct: (productId) => api.delete(`/admin/products-management/${productId}`),
  bulkBlockProducts: (data) => api.post('/admin/products-management/bulk-block', data),
  bulkDeleteProducts: (data) => api.post('/admin/products-management/bulk-delete', data),
  
  // Legacy
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
};

// Vendor Service
export const vendorService = {
  registerVendor: (data) => api.post('/vendor/register', data),
  getProfile: () => api.get('/vendor/profile'),
  updateProfile: (data) => api.put('/vendor/profile', data),
  getMyProducts: (params) => api.get('/vendor/products', { params }),
  createVendorProduct: (data) => api.post('/vendor/products', data),
  updateVendorProduct: (productId, data) => api.put(`/vendor/products/${productId}`, data),
  deleteVendorProduct: (productId) => api.delete(`/vendor/products/${productId}`),
  getVendorReviews: (params) => api.get('/vendor/reviews', { params }),
  getMyOrders: (params) => api.get('/vendor/orders', { params }),
  updateVendorOrderStatus: (orderId, status) => api.put(`/vendor/orders/${orderId}/status`, { status }),
  getDashboardStats: () => api.get('/vendor/stats'),
  getNotifications: (params) => api.get('/vendor/notifications', { params }),
  markNotificationRead: (notificationId) => api.put(`/vendor/notifications/${notificationId}/read`),
};

export default api;
