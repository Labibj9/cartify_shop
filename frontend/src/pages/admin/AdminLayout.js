import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../../services/api';
import { logout } from '../../redux/authSlice';

function AdminLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'Vendors', path: '/admin/vendors', icon: '🏪' },
    { label: 'Categories', path: '/admin/categories', icon: '📁' },
    { label: 'Products', path: '/admin/products', icon: '📦' },
    { label: 'Orders', path: '/admin/orders', icon: '🛒' },
    { label: 'Users', path: '/admin/users', icon: '👥' },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-amazon-blue text-white transition-all duration-300 flex flex-col shadow-lg`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-amazon-light flex items-center justify-between">
          <Link to="/admin" className={`font-bold text-lg ${!sidebarOpen && 'hidden'}`}>
            Admin
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-amazon-orange rounded transition"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded transition ${
                location.pathname === item.path
                  ? 'bg-amazon-orange text-white'
                  : 'hover:bg-amazon-light hover:text-amazon-blue'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={sidebarOpen ? 'block' : 'hidden'}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-amazon-light">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-amazon-light hover:text-amazon-blue transition w-full"
          >
            <span>🚪</span>
            <span className={sidebarOpen ? 'block' : 'hidden'}>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow">
          <h1 className="text-2xl font-bold text-amazon-blue">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-amazon-orange rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
