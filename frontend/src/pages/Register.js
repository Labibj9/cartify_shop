import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService, vendorService } from '../services/api';
import { setAuth } from '../redux/authSlice';

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    accountType: 'user',
    phone: '',
    businessName: '',
    address: '',
    gstNumber: '',
    registrationNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (formData.accountType === 'vendor') {
        await vendorService.registerVendor({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          businessName: formData.businessName,
          address: formData.address,
          gstNumber: formData.gstNumber,
          registrationNumber: formData.registrationNumber,
        });

        setSuccess('Vendor account created. Please wait for admin approval, then sign in.');
        setTimeout(() => navigate('/login'), 1200);
      } else {
        const res = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem('token', res.data.token);
        dispatch(setAuth({ user: res.data.user }));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amazon-light flex items-center justify-center py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-amazon-blue mb-6 text-center">Create Account</h1>
        {error && <div className="bg-red-200 text-red-800 p-3 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-200 text-green-800 p-3 rounded mb-4">{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, accountType: 'user' })}
              className={`py-2 rounded border font-semibold ${
                formData.accountType === 'user'
                  ? 'bg-amazon-blue text-white border-amazon-blue'
                  : 'bg-white text-amazon-blue border-gray-300'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, accountType: 'vendor' })}
              className={`py-2 rounded border font-semibold ${
                formData.accountType === 'vendor'
                  ? 'bg-amazon-blue text-white border-amazon-blue'
                  : 'bg-white text-amazon-blue border-gray-300'
              }`}
            >
              Vendor
            </button>
          </div>

          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amazon-orange"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amazon-orange"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amazon-orange"
            required
          />

          {formData.accountType === 'vendor' && (
            <>
              <input
                type="text"
                placeholder="Business Name"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                required
              />
              <input
                type="text"
                placeholder="GST Number"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                required
              />
              <input
                type="text"
                placeholder="Phone (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amazon-orange"
              />
              <input
                type="text"
                placeholder="Business Address (optional)"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amazon-orange"
              />
              <input
                type="text"
                placeholder="Registration Number (optional)"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-amazon-orange"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amazon-orange hover:bg-orange-600 text-white font-bold py-2 rounded transition disabled:opacity-50"
          >
            {loading
              ? 'Creating...'
              : formData.accountType === 'vendor'
              ? 'Create Vendor Account'
              : 'Create Account'}
          </button>
        </form>
        <p className="text-center mt-4">
          Already have an account? <a href="/login" className="text-amazon-blue font-bold hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}

export default Register;
