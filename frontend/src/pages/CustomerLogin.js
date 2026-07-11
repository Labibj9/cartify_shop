import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService } from '../services/api';
import { setAuth } from '../redux/authSlice';

function CustomerLogin() {
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
      const res = await authService.login(formData);
      
      // Check if user is customer
      if (res.data.user.role !== 'user') {
        setError('Invalid login. Please use the appropriate login page for your role.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('token', res.data.token);
      dispatch(setAuth({ user: res.data.user }));
      navigate('/');
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
          <div className="text-4xl mb-2">👤</div>
          <h1 className="text-3xl font-bold text-amazon-blue">Customer Login</h1>
        </div>
        
        {error && (
          <div className="bg-red-200 text-red-800 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amazon-orange hover:bg-orange-600 text-white font-bold py-2 rounded transition disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm">
          <p>
            Don't have an account? <Link to="/register" className="text-amazon-blue font-bold hover:underline">Register</Link>
          </p>
          <p className="text-gray-600">
            <Link to="/login" className="text-amazon-blue font-bold hover:underline">Back to Login Options</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;
