import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { vendorService } from '../../services/api';
import { formatPrice } from '../../utils/currency';

function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const { selectedCurrency } = useSelector((state) => state.currency);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setError('');
      const res = await vendorService.getMyOrders({ limit: 50 });
      const returnedOrders = res.data.orders || res.data.data?.orders || res.data || [];
      setOrders(Array.isArray(returnedOrders) ? returnedOrders : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      setUpdatingOrderId(orderId);
      await vendorService.updateVendorOrderStatus(orderId, status);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update order status.');
    } finally {
      setUpdatingOrderId('');
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amazon-blue">Incoming Orders</h1>
          <p className="text-gray-600 mt-1">Accept, pack, ship, and track orders for your products.</p>
        </div>
        <button onClick={fetchOrders} className="rounded-lg bg-amazon-blue px-4 py-2 text-white">
          Refresh
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      {orders.length === 0 && !error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xl text-gray-600">No orders yet.</p>
          <p className="mt-2 text-sm text-gray-500">Your incoming customer orders will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-amazon-blue text-white">
              <tr>
                <th className="px-6 py-3 text-left">Order ID</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Items</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const vendorItems = order.orderItems || order.items || [];
                const vendorTotal = vendorItems.reduce((sum, item) => sum + Number(item.convertedPrice ?? item.price ?? 0) * Number(item.quantity ?? 0), 0);

                return (
                  <tr key={order._id} className="border-b border-gray-100 align-top">
                    <td className="px-6 py-4 font-mono text-sm">{order._id?.slice(-8)}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{order.user?.name || 'Customer'}</div>
                      <div className="text-sm text-gray-500">{order.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {vendorItems.map((item, idx) => (
                          <div key={`${order._id}-${idx}`} className="text-sm">
                            <span className="font-medium">{item.title || item.product?.title || 'Product'}</span>
                            <span className="text-gray-500"> x {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-amazon-orange">{formatPrice(vendorTotal, selectedCurrency)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleStatusChange(order._id, 'confirmed')} disabled={updatingOrderId === order._id} className="rounded bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-60">
                          Accept
                        </button>
                        <button onClick={() => handleStatusChange(order._id, 'cancelled')} disabled={updatingOrderId === order._id} className="rounded bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-60">
                          Reject
                        </button>
                        <select
                          className="rounded border border-gray-300 px-2 py-1 text-sm"
                          value={order.orderStatus || 'pending'}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={updatingOrderId === order._id}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="dispatched">Despatched</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VendorOrders;
