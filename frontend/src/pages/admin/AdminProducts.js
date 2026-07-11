import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { adminService } from '../../services/api';
import Toast from '../../components/Toast';
import { formatPrice } from '../../utils/currency';

function AdminProducts() {
  const { selectedCurrency } = useSelector((state) => state.currency);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [uploadingProductId, setUploadingProductId] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [page, status, search, selectedCurrency]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllProducts({ page, limit: 20, status, search });
      setProducts(res.data.products || []);
    } catch (err) {
      showToast('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        showToast('Only JPG, PNG, and WebP images are allowed', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
      }
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setUploadPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!uploadFile || !uploadingProductId) return;
    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('image', uploadFile);
      await adminService.updateProduct(uploadingProductId, formData);
      showToast('Image uploaded successfully', 'success');
      setUploadingProductId(null);
      setUploadFile(null);
      setUploadPreview(null);
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleBlockProduct = async (productId) => {
    try {
      await adminService.blockProduct(productId, { reason: 'Blocked by admin' });
      showToast('Product blocked', 'success');
      fetchProducts();
    } catch (err) {
      showToast('Failed to block product', 'error');
    }
  };

  const handleUnblockProduct = async (productId) => {
    try {
      await adminService.unblockProduct(productId);
      showToast('Product unblocked', 'success');
      fetchProducts();
    } catch (err) {
      showToast('Failed to unblock product', 'error');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminService.deleteProduct(productId);
        showToast('Product deleted', 'success');
        fetchProducts();
      } catch (err) {
        showToast('Failed to delete product', 'error');
      }
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleStatusFilter = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amazon-light py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-amazon-blue mb-8">Manage Products</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={handleSearchChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amazon-orange"
            />
            <select
              value={status}
              onChange={handleStatusFilter}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amazon-orange"
            >
              <option value="all">All Products</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="low-stock">Low Stock</option>
            </select>
            <div></div>
          </div>
        </div>

        {/* Toast */}
        {toast.message && <Toast message={toast.message} type={toast.type} />}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-amazon-blue text-white">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={(e) =>
                      setSelectedProducts(e.target.checked ? products.map((p) => p._id) : [])
                    }
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-6 py-3 text-left">Product</th>
                <th className="px-6 py-3 text-left">Vendor</th>
                <th className="px-6 py-3 text-left">Price</th>
                <th className="px-6 py-3 text-left">Stock</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => toggleProductSelection(product._id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{product.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{product.vendor?.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{formatPrice(product.price, selectedCurrency)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          product.stock < 10
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-y-1">
                      <button
                        onClick={() => setUploadingProductId(product._id)}
                        className="block w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                      >
                        Upload Image
                      </button>
                      {product.isActive ? (
                        <button
                          onClick={() => handleBlockProduct(product._id)}
                          className="block w-full px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                        >
                          Block
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblockProduct(product._id)}
                          className="block w-full px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                        >
                          Unblock
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="block w-full px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-amazon-blue text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-700">Page {page}</span>
          <button
            disabled={products.length < 20}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-amazon-blue text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Image Upload Modal */}
        {uploadingProductId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-amazon-blue mb-6">Upload Product Image</h2>

              {/* File Input Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-amazon-blue transition mb-6">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="modal-image-input"
                />
                <label htmlFor="modal-image-input" className="cursor-pointer block">
                  {uploadPreview ? (
                    <>
                      <img
                        src={uploadPreview}
                        alt="Preview"
                        className="max-h-40 mx-auto mb-3 rounded"
                      />
                      <p className="text-sm text-gray-600">Click to change image</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-2">📁 Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">JPG, PNG, WebP up to 5MB</p>
                    </>
                  )}
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleUploadImage}
                  disabled={!uploadFile || uploadLoading}
                  className="flex-1 px-4 py-2 bg-amazon-blue text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  {uploadLoading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  onClick={() => {
                    setUploadingProductId(null);
                    setUploadFile(null);
                    setUploadPreview(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProducts;
