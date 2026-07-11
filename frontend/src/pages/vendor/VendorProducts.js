import React, { useEffect, useState } from 'react';
import { vendorService, categoryService } from '../../services/api';
import Toast from '../../components/Toast';
import { formatPrice } from '../../utils/currency';
import { useSelector } from 'react-redux';

function VendorProducts() {
  const { selectedCurrency } = useSelector((state) => state.currency);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    category: '',
    imageFile: null,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 2200);
  };

  const fetchProducts = async () => {
    try {
      const res = await vendorService.getMyProducts({ limit: 100 });
      setProducts(res.data.products || res.data.data?.products || res.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Failed to load categories', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('title', productForm.title);
      fd.append('name', productForm.title);
      fd.append('description', productForm.description || '');
      fd.append('price', productForm.price);
      fd.append('discountPrice', productForm.discountPrice || 0);
      fd.append('stock', productForm.stock || 0);
      fd.append('category', productForm.category || '');
      if (productForm.imageFile) fd.append('images', productForm.imageFile);

      if (isEditing && editingId) {
        await vendorService.updateVendorProduct(editingId, fd);
        showToast('Product updated successfully.');
      } else {
        await vendorService.createVendorProduct(fd);
        showToast('Product added successfully.');
      }

      resetForm();
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setProductForm({ title: '', description: '', price: '', discountPrice: '', stock: '', category: '', imageFile: null });
    setIsEditing(false);
    setEditingId('');
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setEditingId(product._id);
    setProductForm({
      title: product.title || product.name || '',
      description: product.description || '',
      price: product.price || '',
      discountPrice: product.discountPrice || product.discount || '',
      stock: product.stock || product.inventory || '',
      category: product.category?._id || product.category || '',
      imageFile: null,
    });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await vendorService.deleteVendorProduct(productId);
      showToast('Product deleted.');
      fetchProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to delete product.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {toast.message && <Toast message={toast.message} type={toast.type} />}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-amazon-blue">My Products</h2>
          <p className="text-gray-600 mt-1">Create, update, and manage your catalog.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="rounded-lg bg-amazon-orange px-4 py-2 font-semibold text-white"
        >
          + Add Product
        </button>
      </div>

      <div id="product-form" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{isEditing ? 'Edit Product' : 'Add New Product'}</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Product name"
            value={productForm.title}
            onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
          />
          <select
            className="rounded-lg border border-gray-300 px-3 py-2"
            value={productForm.category}
            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id || category.id} value={category._id || category.id}>
                {category.name || category.title}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            min="0"
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Price"
            value={productForm.price}
            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
          />
          <input
            type="number"
            min="0"
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Discount price"
            value={productForm.discountPrice}
            onChange={(e) => setProductForm({ ...productForm, discountPrice: e.target.value })}
          />
          <input
            required
            type="number"
            min="0"
            className="rounded-lg border border-gray-300 px-3 py-2"
            placeholder="Stock quantity"
            value={productForm.stock}
            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
          />
          <input
            type="file"
            accept="image/*"
            className="rounded-lg border border-gray-300 px-3 py-2"
            onChange={(e) => setProductForm({ ...productForm, imageFile: e.target.files?.[0] || null })}
          />
          <textarea
            className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2"
            rows="3"
            placeholder="Short description"
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
          />
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" disabled={saving} className="rounded-lg bg-amazon-blue px-4 py-2 font-semibold text-white disabled:opacity-60">
              {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Add Product'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700">
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Stock</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">No products yet.</td></tr>
              ) : (
                products.map((product) => {
                  const stock = Number(product.stock || product.inventory || 0);
                  return (
                    <tr key={product._id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{product.title || product.name}</div>
                        <div className="text-sm text-gray-500">{product.category?.name || product.category || 'Uncategorized'}</div>
                      </td>
                      <td className="px-4 py-3">{formatPrice(product.price, selectedCurrency)}</td>
                      <td className="px-4 py-3">{stock}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {stock < 5 ? 'Low stock' : 'In stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(product)} className="rounded bg-blue-600 px-3 py-1 text-sm text-white">Edit</button>
                          <button onClick={() => handleDelete(product._id)} className="rounded bg-red-600 px-3 py-1 text-sm text-white">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default VendorProducts;
