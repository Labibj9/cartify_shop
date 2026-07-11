import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService } from '../services/api';
import { setAuth } from '../redux/authSlice';

function AdminLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      localStorage.removeItem('token');
      const res = await authService.login(formData);
      
      // Check if user is admin
      if (res.data.user.role !== 'admin') {
        setError('Invalid login. Admin access required.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('token', res.data.token);
      dispatch(setAuth({ user: res.data.user }));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amazon-light flex items-center justify-center py-8">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚙️</div>
          <h1 className="text-3xl font-bold text-amazon-blue">Admin Login</h1>
          <p className="text-red-600 text-sm mt-2">Restricted Access</p>
        </div>
        
        {error && (
          <div className="bg-red-200 text-red-800 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm">
          <p className="text-gray-600 bg-yellow-50 p-2 rounded">
            ⚠️ This page is for administrators only
          </p>
          <p className="text-gray-600">
            <Link to="/login" className="text-amazon-blue font-bold hover:underline">Back to Login Options</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
