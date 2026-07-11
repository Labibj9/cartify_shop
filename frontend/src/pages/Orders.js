import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { orderService } from '../services/api';
import { formatPrice } from '../utils/currency';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedCurrency } = useSelector((state) => state.currency);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderService.getMyOrders();
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
        <h1 className="text-3xl font-bold text-amazon-blue mb-8">Your Orders</h1>
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 text-xl">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Order #{order._id.slice(-8)}</h3>
                    <p className="text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-4 py-2 rounded font-bold ${order.orderStatus === 'delivered' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                    {order.orderStatus.toUpperCase()}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <p className="font-bold mb-2">Items:</p>
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.product?.title} x {item.quantity}</span>
                      <span>{formatPrice(item.convertedPrice ?? item.price, selectedCurrency)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-amazon-orange">{formatPrice(order.convertedPrice ?? order.totalPrice, selectedCurrency)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
