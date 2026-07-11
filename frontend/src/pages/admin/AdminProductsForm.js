import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, categoryService } from '../../services/api';
import Toast from '../../components/Toast';

function AdminProductsForm({ productId = null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    discount: '',
    stock: '',
    category: '',
    image: null,
  });

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getCategories();
      const tree = res.data.data || [];
      const flat = [];
      const walk = (nodes, depth = 0) => {
        (nodes || []).forEach((n) => {
          flat.push({ _id: n._id, name: (depth ? '— '.repeat(depth) : '') + n.name });
          if (n.children && n.children.length) walk(n.children, depth + 1);
        });
      };
      walk(tree);
      setCategories(flat);
    } catch (err) {
      showToast('Failed to load categories', 'error');
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await adminService.getProductById(productId);
      const product = res.data.product;
      setForm({
        title: product.title,
        description: product.description,
        price: product.price,
        discount: product.discount || '',
        stock: product.stock,
        category: product.category._id,
        image: null,
      });
      if (product.image) {
        setImagePreview(product.image);
      }
    } catch (err) {
      showToast('Failed to load product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 2000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        showToast('Only JPG, PNG, and WebP images are allowed', 'error');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast('File size must be less than 5MB', 'error');
        return;
      }

      setForm({ ...form, image: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.price || !form.stock || !form.category) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('discount', form.discount);
      formData.append('stock', form.stock);
      formData.append('category', form.category);

      if (form.image) {
        formData.append('image', form.image);
      }

      if (productId) {
        await adminService.updateProduct(productId, formData);
        showToast('Product updated successfully', 'success');
      } else {
        await adminService.createProduct(formData);
        showToast('Product created successfully', 'success');
        setForm({
          title: '',
          description: '',
          price: '',
          discount: '',
          stock: '',
          category: '',
          image: null,
        });
        setImagePreview(null);
      }

      setTimeout(() => navigate('/admin/products'), 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && productId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amazon-light py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-amazon-blue mb-8">
          {productId ? 'Edit Product' : 'Add New Product'}
        </h1>

        {toast.message && <Toast message={toast.message} type={toast.type} />}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amazon-blue focus:border-transparent"
                  placeholder="Enter product title"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amazon-blue focus:border-transparent"
                  placeholder="Enter product description"
                  required
                />
              </div>

              {/* Price */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amazon-blue focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Discount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%) - Optional
                </label>
                <input
                  type="number"
                  name="discount"
                  value={form.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amazon-blue focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Stock */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amazon-blue focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amazon-blue focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Image Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image {!productId && '*'}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-amazon-blue transition">
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="image-input"
                    required={!productId}
                  />
                  <label htmlFor="image-input" className="cursor-pointer block">
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 mx-auto mb-4 rounded"
                        />
                        <p className="text-sm text-gray-600">Click to change image</p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">
                          JPG, PNG, WebP up to 5MB
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-amazon-blue text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminProductsForm;
