import React, { useState } from 'react';
import { formatPrice } from '../utils/currency';

function CheckoutModal({ isOpen, cart, selectedCurrency = 'INR', onClose, onPlaceOrder, onOrderComplete }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    paymentMethod: 'credit_card',
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 500 ? 0 : 100;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.zipCode) {
      alert('Please fill all fields');
      return;
    }

    // Create order
    const order = {
      orderId: `ORD-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      items: cartItems,
      shipping: formData,
      subtotal: subtotal.toFixed(2),
      shippingCost: shipping.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: formData.paymentMethod,
      status: 'Confirmed',
    };

    setOrderDetails(order);
    setOrderPlaced(true);
    
    // Call the callback if provided
    if (onPlaceOrder) {
      onPlaceOrder(order);
    }
  };

  const handleNewOrder = () => {
    setOrderPlaced(false);
    setOrderDetails(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      paymentMethod: 'credit_card',
    });
    // notify parent that user finished viewing confirmation (so parent can clear cart)
    if (onOrderComplete) onOrderComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
        {!orderPlaced ? (
          <>
            {/* Header */}
            <div className="bg-amazon-blue text-white p-6 flex justify-between items-center sticky top-0">
              <h2 className="text-2xl font-bold">Checkout</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Side - Form */}
                <div>
                  <h3 className="text-lg font-bold text-amazon-blue mb-4">Delivery Address</h3>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                          placeholder="9999999999"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                          placeholder="NY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">ZIP Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                          placeholder="10001"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method</label>
                      <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amazon-orange"
                      >
                        <option value="credit_card">Credit Card</option>
                        <option value="debit_card">Debit Card</option>
                        <option value="upi">UPI</option>
                        <option value="wallet">Digital Wallet</option>
                      </select>
                    </div>
                  </form>
                </div>

                {/* Right Side - Order Summary */}
                <div>
                  <h3 className="text-lg font-bold text-amazon-blue mb-4">Order Summary</h3>
                  
                  {/* Cart Items */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
                    {cartItems.length > 0 ? (
                      cartItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm mb-3 pb-3 border-b last:border-b-0">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 line-clamp-1">{item.title}</p>
                            <p className="text-gray-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-amazon-orange">{formatPrice(item.price * item.quantity, selectedCurrency)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No items in cart</p>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="border-t-2 pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal</span>
                      <span className="font-semibold">{formatPrice(subtotal, selectedCurrency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Shipping</span>
                      <span className="font-semibold">
                        {shipping === 0 ? (
                          <span className="text-green-600">FREE</span>
                        ) : (
                          formatPrice(shipping, selectedCurrency)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Tax (18%)</span>
                      <span className="font-semibold">{formatPrice(tax, selectedCurrency)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>Total</span>
                      <span className="text-amazon-orange">{formatPrice(total, selectedCurrency)}</span>
                    </div>
                  </div>

                  {/* Note */}
                  {subtotal > 0 && subtotal < 500 && (
                    <p className="text-xs text-green-600 mt-3 bg-green-50 p-2 rounded">
                      ✓ Free shipping on orders above $500
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6 pt-6 border-t">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-amazon-blue text-amazon-blue hover:bg-blue-50 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={cartItems.length === 0}
                  className="flex-1 px-4 py-3 bg-amazon-orange hover:bg-orange-600 text-white rounded-lg font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Place Order
                </button>
              </div>
            </div>
          </>
        ) : (
          // Order Confirmation
          <div className="p-8 text-center">
            <div className="mb-4 text-5xl">✅</div>
            <h2 className="text-3xl font-bold text-amazon-blue mb-2">Order Confirmed!</h2>
            <p className="text-gray-600 mb-6">Thank you for your purchase</p>

            <div className="bg-amazon-light rounded-lg p-6 mb-6 text-left">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-bold text-lg text-amazon-blue">{orderDetails.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-bold text-lg">{orderDetails.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-bold text-lg text-amazon-orange">{formatPrice(orderDetails.total, selectedCurrency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-bold text-lg text-green-600">{orderDetails.status}</p>
                </div>
              </div>

              <hr className="my-4" />

              <div className="text-left">
                <p className="text-sm font-semibold text-gray-700 mb-2">Delivery Address</p>
                <p className="text-sm text-gray-600">
                  {orderDetails.shipping.fullName}<br />
                  {orderDetails.shipping.address}<br />
                  {orderDetails.shipping.city}, {orderDetails.shipping.state} {orderDetails.shipping.zipCode}<br />
                  {orderDetails.shipping.phone}
                </p>
              </div>

              <hr className="my-4" />

              <div className="text-left">
                <p className="text-sm font-semibold text-gray-700 mb-3">Items Ordered ({orderDetails.items.length})</p>
                {orderDetails.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm mb-2">
                    <span>{item.title} (x{item.quantity})</span>
                    <span className="font-semibold">{formatPrice(item.price * item.quantity, selectedCurrency)}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              A confirmation email has been sent to {orderDetails.shipping.email}
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleNewOrder}
                className="flex-1 px-4 py-3 bg-amazon-orange hover:bg-orange-600 text-white rounded-lg font-semibold transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutModal;
