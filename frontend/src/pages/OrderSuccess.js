import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const paymentMethod = searchParams.get('paymentMethod');

  const successMessageByMethod = {
    PAYPAL: 'PayPal payment completed and your order was created successfully.',
    UPI: 'UPI payment completed and your order was created successfully.',
    COD: 'Order created successfully with Cash on Delivery.',
  };

  const successMessage =
    successMessageByMethod[paymentMethod] || 'Order created successfully.';

  return (
    <div className="min-h-screen bg-amazon-light flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-amazon-blue mb-3">Order Created Successfully</h1>
        <p className="text-gray-600 mb-6">{successMessage}</p>

        {orderId && (
          <p className="text-sm text-gray-700 mb-6">
            Order ID: <span className="font-semibold">{orderId}</span>
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Link to="/orders" className="bg-amazon-blue text-white px-5 py-2 rounded font-semibold hover:bg-blue-900">
            View Orders
          </Link>
          <Link to="/products" className="bg-amazon-orange text-white px-5 py-2 rounded font-semibold hover:bg-orange-600">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;
