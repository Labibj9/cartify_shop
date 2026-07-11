import React from 'react';
import { useNavigate } from 'react-router-dom';

function LoginSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-amazon-light flex items-center justify-center py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amazon-blue mb-2">Welcome to Cartify</h1>
          <p className="text-gray-600">Choose your login type to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer Login */}
          <div
            onClick={() => navigate('/login/customer')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">👤</div>
              <h2 className="text-2xl font-bold text-amazon-blue mb-2">Customer</h2>
              <p className="text-gray-600 text-sm mb-6">Shop for products and manage your orders</p>
              <button className="w-full bg-amazon-orange hover:bg-orange-600 text-white font-bold py-2 rounded transition">
                Sign In as Customer
              </button>
            </div>
          </div>

          {/* Vendor Login */}
          <div
            onClick={() => navigate('/login/vendor')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">🏪</div>
              <h2 className="text-2xl font-bold text-amazon-blue mb-2">Vendor</h2>
              <p className="text-gray-600 text-sm mb-6">Manage your store and sell products</p>
              <button className="w-full bg-amazon-blue hover:bg-blue-900 text-white font-bold py-2 rounded transition">
                Sign In as Vendor
              </button>
            </div>
          </div>

          {/* Admin Login */}
          <div
            onClick={() => navigate('/login/admin')}
            className="bg-white rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-5xl mb-4">⚙️</div>
              <h2 className="text-2xl font-bold text-amazon-blue mb-2">Admin</h2>
              <p className="text-gray-600 text-sm mb-6">Manage platform and users</p>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition">
                Sign In as Admin
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-gray-600">
          Don't have an account? <a href="/register" className="text-amazon-blue font-bold hover:underline">Register here</a>
        </p>
      </div>
    </div>
  );
}

export default LoginSelector;
