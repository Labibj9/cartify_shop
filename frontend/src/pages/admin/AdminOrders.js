import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { adminService } from '../../services/api';
import { formatPrice } from '../../utils/currency';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedCurrency } = useSelector((state) => state.currency);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await adminService.getAllOrders();
        setOrders(res.data.orders);
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [selectedCurrency]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-amazon-light py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-amazon-blue mb-8">Manage Orders</h1>
        <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-amazon-blue text-white">
              <tr>
                <th className="px-6 py-3 text-left">Order ID</th>
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 font-mono text-sm">{order._id.slice(-8)}</td>
                  <td className="px-6 py-3">{order.user?.name}</td>
                  <td className="px-6 py-3 text-amazon-orange font-bold">{formatPrice(order.convertedPrice ?? order.totalPrice, selectedCurrency)}</td>
                  <td className="px-6 py-3"><span className={`px-3 py-1 rounded text-sm font-bold ${order.orderStatus === 'delivered' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{order.orderStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminOrders;
