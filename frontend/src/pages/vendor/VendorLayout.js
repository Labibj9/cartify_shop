import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authService } from '../../services/api';
import { logout } from '../../redux/authSlice';

function VendorLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const menuItems = [
    { label: 'Dashboard', path: '/vendor/dashboard' },
    { label: 'Products', path: '/vendor/products' },
    { label: 'Orders', path: '/vendor/orders' },
    { label: 'Reports', path: '/vendor/reports' },
    { label: 'Operations', path: '/vendor/operations' },
    { label: 'Reviews', path: '/vendor/reviews' },
    { label: 'Profile', path: '/vendor/profile' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-amazon-blue text-white flex flex-col shadow-lg">
        <div className="p-4 border-b border-amazon-light">
          <Link to="/vendor/dashboard" className="font-bold text-lg">
            Vendor Panel
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded transition ${
                location.pathname === item.path
                  ? 'bg-amazon-orange text-white'
                  : 'hover:bg-amazon-light hover:text-amazon-blue'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-amazon-light">
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded hover:bg-amazon-light hover:text-amazon-blue transition w-full text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow">
          <h1 className="text-2xl font-bold text-amazon-blue">Vendor Panel</h1>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">{user?.vendorProfile?.businessName || user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default VendorLayout;
