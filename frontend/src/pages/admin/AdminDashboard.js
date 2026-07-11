import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { adminService } from '../../services/api';
import { formatPrice } from '../../utils/currency';
import { getProductImageUrl } from '../../utils/productImage';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { selectedCurrency } = useSelector((state) => state.currency);

  useEffect(() => {
    fetchStats();
  }, [selectedCurrency]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAdminDashboardStats();
      setStats(res.data.stats || {});
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: '🧾',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: '🛒',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: '📦',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Active Vendors',
      value: stats?.activeVendors || 0,
      icon: '🏪',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Revenue',
      value: formatPrice(stats?.totalRevenue || 0, selectedCurrency),
      icon: '💰',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  const lowStockProducts = stats?.lowStockProducts || [];
  const pendingVendors = stats?.pendingVendors || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome to your admin panel</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className={`${card.bgColor} rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200`}>
            <div className="flex flex-col gap-2">
              <span className="text-3xl">{card.icon}</span>
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium leading-tight">{card.title}</p>
                <p className={`${card.textColor} text-2xl sm:text-3xl font-bold mt-1`}>{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/admin/vendors"
            className="p-4 bg-gradient-to-r from-amazon-blue to-amazon-light rounded-lg hover:shadow-md transition text-white font-medium"
          >
            📋 View Vendors
            {pendingVendors > 0 && (
              <span className="ml-2 rounded-full bg-white/30 px-2 py-0.5 text-xs">{pendingVendors} pending</span>
            )}
          </a>
          <a
            href="/admin/products"
            className="p-4 bg-gradient-to-r from-amazon-orange to-yellow-500 rounded-lg hover:shadow-md transition text-white font-medium"
          >
            📦 Manage Products
            {stats?.lowStockCount > 0 && (
              <span className="ml-2 rounded-full bg-white/30 px-2 py-0.5 text-xs">{stats.lowStockCount} low</span>
            )}
          </a>
          <a
            href="/admin/categories"
            className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-md transition text-white font-medium"
          >
            🏷️ Categories
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Vendors */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Vendors {pendingVendors > 0 && (
              <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-sm text-orange-700">{pendingVendors}</span>
            )}
          </h3>
          {pendingVendors > 0 ? (
            <div className="text-sm text-gray-600">
              You have <span className="font-semibold text-gray-900">{pendingVendors}</span> vendor(s) awaiting approval.{' '}
              <a href="/admin/vendors" className="text-amazon-blue font-medium hover:underline">Review them here</a>.
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No pending vendor approvals 🎉</div>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Low Stock Alert {stats?.lowStockCount > 0 && (
              <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-sm text-red-700">{stats.lowStockCount}</span>
            )}
          </h3>
          {lowStockProducts.length > 0 ? (
            <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {lowStockProducts.map((p) => (
                <li key={p._id} className="flex items-center gap-3 py-3">
                  <img
                    src={getProductImageUrl(p)}
                    alt={p.title}
                    className="h-10 w-10 rounded object-cover border border-gray-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.vendor?.name || 'Unknown vendor'}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                      p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">All products are well stocked 🎉</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
