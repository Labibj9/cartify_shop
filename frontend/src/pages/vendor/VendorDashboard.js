import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { vendorService } from '../../services/api';
import { formatPrice } from '../../utils/currency';

function VendorDashboard() {
  const { selectedCurrency } = useSelector((state) => state.currency);
  const { user } = useSelector((state) => state.auth);
  const firstName = user?.name?.split(' ')[0] || 'Vendor';
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError('');
        const [statsRes, ordersRes, notificationsRes] = await Promise.all([
          vendorService.getDashboardStats(),
          vendorService.getMyOrders({ limit: 5 }),
          vendorService.getNotifications({ limit: 5 }),
        ]);

        const statsData = statsRes.data.stats || statsRes.data.data?.stats || statsRes.data || {};
        const ordersData = Array.isArray(ordersRes.data.orders || ordersRes.data.data?.orders || ordersRes.data)
          ? ordersRes.data.orders || ordersRes.data.data?.orders || ordersRes.data
          : [];
        const notificationsData = Array.isArray(notificationsRes.data.notifications || notificationsRes.data.data?.notifications || notificationsRes.data)
          ? notificationsRes.data.notifications || notificationsRes.data.data?.notifications || notificationsRes.data
          : [];

        setStats({
          totalOrders: statsData.totalOrders || statsData.ordersCount || 0,
          totalRevenue: statsData.totalRevenue || statsData.revenue || statsData.totalSales || 0,
          totalProducts: statsData.totalProducts || statsData.productsCount || 0,
          pendingOrders: statsData.pendingOrders || statsData.pendingCount || 0,
          lowStockProducts: statsData.lowStockProducts || statsData.lowStockCount || 0,
        });
        setOrders(ordersData);
        setNotifications(notificationsData);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-amazon-blue">Hello, {firstName}</h2>
        <p className="text-gray-600 mt-1">Overview of your store, orders, and inventory.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total Orders', value: stats.totalOrders, accent: 'bg-amazon-blue text-white' },
          { label: 'Revenue', value: formatPrice(stats.totalRevenue, selectedCurrency), accent: 'bg-green-600 text-white' },
          { label: 'Products', value: stats.totalProducts, accent: 'bg-purple-600 text-white' },
          { label: 'Pending Orders', value: stats.pendingOrders, accent: 'bg-yellow-600 text-white' },
          { label: 'Low Stock', value: stats.lowStockProducts, accent: 'bg-red-600 text-white' },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-4 shadow ${item.accent}`}>
            <p className="text-sm opacity-90">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <span className="text-sm text-gray-500">Latest activity</span>
          </div>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-gray-500">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="font-semibold text-gray-900">#{order._id?.slice(-8)}</p>
                    <p className="text-sm text-gray-500">{order.user?.name || 'Customer'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amazon-orange">{formatPrice(order.totalPrice || order.convertedPrice || 0, selectedCurrency)}</p>
                    <p className="text-sm text-gray-500">{order.orderStatus}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Order Notifications</h3>
            <span className="text-sm text-gray-500">Live updates</span>
          </div>
          {notifications.length === 0 ? (
            <p className="py-6 text-center text-gray-500">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item._id || item.id} className="rounded-lg border border-gray-100 p-3">
                  <p className="font-medium text-gray-900">{item.title || 'New update'}</p>
                  <p className="text-sm text-gray-600">{item.message || item.description || 'You have a new update.'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
