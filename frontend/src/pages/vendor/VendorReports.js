import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { vendorService } from '../../services/api';
import { formatPrice } from '../../utils/currency';

function VendorReports() {
  const { selectedCurrency } = useSelector((state) => state.currency);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, pendingOrders: 0, totalProducts: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          vendorService.getDashboardStats(),
          vendorService.getMyOrders({ limit: 20 }),
        ]);
        const statsData = statsRes.data.stats || statsRes.data.data?.stats || statsRes.data || {};
        const ordersData = Array.isArray(ordersRes.data.orders || ordersRes.data.data?.orders || ordersRes.data)
          ? ordersRes.data.orders || ordersRes.data.data?.orders || ordersRes.data
          : [];
        setStats({
          totalRevenue: statsData.totalRevenue || statsData.revenue || 0,
          totalOrders: statsData.totalOrders || statsData.ordersCount || 0,
          pendingOrders: statsData.pendingOrders || statsData.pendingCount || 0,
          totalProducts: statsData.totalProducts || statsData.productsCount || 0,
        });
        setOrders(ordersData);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const averageOrderValue = orders.length ? stats.totalRevenue / orders.length : 0;

  if (loading) return <div className="py-12 text-center">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-amazon-blue">Sales Reports</h2>
        <p className="text-gray-600 mt-1">Track sales performance, revenue, and order health.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-amazon-blue p-4 text-white shadow">
          <p className="text-sm opacity-90">Revenue</p>
          <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue, selectedCurrency)}</p>
        </div>
        <div className="rounded-xl bg-green-600 p-4 text-white shadow">
          <p className="text-sm opacity-90">Orders</p>
          <p className="text-2xl font-bold">{stats.totalOrders}</p>
        </div>
        <div className="rounded-xl bg-yellow-600 p-4 text-white shadow">
          <p className="text-sm opacity-90">Pending</p>
          <p className="text-2xl font-bold">{stats.pendingOrders}</p>
        </div>
        <div className="rounded-xl bg-purple-600 p-4 text-white shadow">
          <p className="text-sm opacity-90">Avg. Order Value</p>
          <p className="text-2xl font-bold">{formatPrice(averageOrderValue, selectedCurrency)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Sales</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold">#{order._id?.slice(-8)}</td>
                  <td className="px-4 py-3">{order.user?.name || 'Customer'}</td>
                  <td className="px-4 py-3">{formatPrice(order.totalPrice || order.convertedPrice || 0, selectedCurrency)}</td>
                  <td className="px-4 py-3">{order.orderStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default VendorReports;
