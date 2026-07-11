import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { orderService, paymentService } from '../services/api';
import { formatPrice } from '../utils/currency';

function Checkout() {
  const navigate = useNavigate();
  const { cart, total } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { selectedCurrency } = useSelector((state) => state.currency);
  const paypalContainerRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [paypalError, setPayPalError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalDebug, setPayPalDebug] = useState('Initializing PayPal...');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('PAYPAL');
  const [address, setAddress] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const paypalClientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
  const razorpayKeyId = process.env.REACT_APP_RAZORPAY_KEY_ID;
  const hasValidPayPalClientId =
    !!paypalClientId &&
    !paypalClientId.includes('your_real_sandbox_or_live_client_id') &&
    paypalClientId.length > 20;
  const hasValidRazorpayKeyId =
    !!razorpayKeyId &&
    razorpayKeyId.length > 8 &&
    !razorpayKeyId.includes('rzp_test_key');

  const validateCheckoutInput = () => {
    if (!isAuthenticated) {
      setPayPalError('Please login to continue payment.');
      navigate('/login');
      return false;
    }

    if (
      !address.fullName ||
      !address.email ||
      !address.phone ||
      !address.address ||
      !address.city ||
      !address.state ||
      !address.zipCode
    ) {
      setPayPalError('Please fill all shipping details before paying.');
      return false;
    }

    if (!cart || cart.length === 0) {
      setPayPalError('Your cart is empty.');
      return false;
    }

    setPayPalError('');
    return true;
  };

  useEffect(() => {
    if (!hasValidPayPalClientId) {
      setPayPalError('Missing REACT_APP_PAYPAL_CLIENT_ID in frontend environment.');
      setPayPalDebug('PayPal client ID is missing or still placeholder.');
      if (selectedPaymentMethod === 'PAYPAL') {
        return;
      }
    }

    const scriptId = 'paypal-sdk-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript && window.paypal) {
      setSdkReady(true);
      setPayPalDebug('PayPal SDK already loaded.');
      return;
    }

    if (existingScript && !window.paypal) {
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD`;
    script.async = true;
    script.onload = () => {
      setPayPalDebug('PayPal SDK loaded. Rendering buttons...');
      setSdkReady(true);
    };
    script.onerror = () => {
      setPayPalError('Failed to load PayPal SDK.');
      setPayPalDebug('Script load error from paypal.com SDK endpoint.');
    };
    document.body.appendChild(script);
  }, [paypalClientId, hasValidPayPalClientId]);

  useEffect(() => {
    const scriptId = 'razorpay-sdk-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript && window.Razorpay) {
      setRazorpayReady(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayReady(true);
    script.onerror = () => setRazorpayReady(false);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!sdkReady || !paypalContainerRef.current || !window.paypal) return;
    if (selectedPaymentMethod !== 'PAYPAL') return;
    if (!hasValidPayPalClientId) return;

    paypalContainerRef.current.innerHTML = '';
    setPayPalDebug('Creating PayPal Buttons instance...');

    const buttons = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        shape: 'rect',
        label: 'paypal',
      },
      onClick: () => {
        return validateCheckoutInput();
      },
      createOrder: async () => {
        setIsProcessing(true);
        setPayPalDebug('Creating PayPal order on server...');
        try {
          const payload = {
            items: cart,
            totalAmount: total,
            shippingAddress: address,
          };
          console.log('Creating PayPal order with payload:', payload);
          const response = await paymentService.createPayPalOrder(payload);
          console.log('PayPal order response:', response.data);

          const { orderID, localOrderId } = response.data;
          localStorage.setItem('pendingPayPalLocalOrderId', localOrderId);
          setPayPalDebug('Order created. Opening PayPal popup...');
          return orderID;
        } catch (error) {
          const message = error.response?.data?.message || 'Unable to create PayPal order.';
          setPayPalError(message);
          setPayPalDebug(`Create order failed: ${message}`);
          throw error;
        } finally {
          setIsProcessing(false);
        }
      },
      onApprove: async (data) => {
        setIsProcessing(true);
        setPayPalDebug('Payment approved. Capturing on server...');
        try {
          const localOrderId = localStorage.getItem('pendingPayPalLocalOrderId');
          const response = await paymentService.capturePayPalOrder({
            orderID: data.orderID,
            localOrderId,
          });

          localStorage.removeItem('pendingPayPalLocalOrderId');
          setPayPalDebug('Payment captured successfully. Redirecting...');
          navigate(`/order-success?orderId=${response.data.order._id}&paymentMethod=PAYPAL`);
        } catch (error) {
          const message = error.response?.data?.message || 'PayPal capture failed.';
          setPayPalError(message);
          setPayPalDebug(`Capture failed: ${message}`);
        } finally {
          setIsProcessing(false);
        }
      },
      onError: () => {
        setPayPalError('PayPal checkout failed. Please try again.');
        setPayPalDebug('PayPal onError callback fired. Check browser console for details.');
      },
      onCancel: () => {
        setPayPalError('Payment was cancelled.');
      },
    });

    if (!buttons || !buttons.isEligible || !buttons.isEligible()) {
      setPayPalError('PayPal is not eligible on this device/browser/account.');
      setPayPalDebug('Buttons instance not eligible.');
      return;
    }

    buttons
      .render(paypalContainerRef.current)
      .then(() => setPayPalDebug('PayPal button rendered successfully.'))
      .catch((error) => {
        const message = error?.message || 'Unknown PayPal render error.';
        setPayPalError(`PayPal render failed: ${message}`);
        setPayPalDebug(`Render error: ${message}`);
      });
  }, [
    sdkReady,
    cart,
    total,
    address,
    isAuthenticated,
    navigate,
    selectedPaymentMethod,
    hasValidPayPalClientId,
  ]);

  const handleCodOrder = async () => {
    if (!validateCheckoutInput()) return;

    setIsProcessing(true);
    try {
      const orderPayload = {
        shippingAddress: address,
        paymentMethod: 'COD',
        items: cart, // Include cart items explicitly
      };
      console.log('Creating COD order with payload:', orderPayload);
      const response = await orderService.createOrder(orderPayload);
      console.log('Order created response:', response.data);
      const orderId = response.data?.order?._id;
      navigate(`/order-success?orderId=${orderId}&paymentMethod=COD`);
    } catch (error) {
      console.error('COD order creation failed:', error);
      const message = error.response?.data?.message || 'Unable to place COD order.';
      setPayPalError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpiPayment = async () => {
    if (!validateCheckoutInput()) return;

    if (!razorpayReady || !window.Razorpay) {
      setPayPalError('Razorpay SDK failed to load. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    try {
      const createPayload = {
        shippingAddress: address,
      };
      console.log('Creating UPI order with payload:', createPayload);
      const createResponse = await paymentService.createUpiOrder(createPayload);
      console.log('UPI order response:', createResponse.data);

      const {
        mock,
        key,
        amount,
        currency,
        razorpayOrderId,
        localOrderId,
      } = createResponse.data;

      if (mock) {
        const verifyResponse = await paymentService.verifyUpiPayment({
          localOrderId,
          mock: true,
        });
        navigate(`/order-success?orderId=${verifyResponse.data.order._id}&paymentMethod=UPI`);
        return;
      }

      const razorpayPublicKey = key || razorpayKeyId;
      if (!razorpayPublicKey) {
        setPayPalError('Razorpay is not configured. Set backend RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
        return;
      }

      const options = {
        key: razorpayPublicKey,
        amount,
        currency,
        name: 'Cartify',
        description: 'UPI Payment',
        order_id: razorpayOrderId,
        method: {
          upi: true,
        },
        upi: {
          flow: 'intent',
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI Apps',
                instruments: [{ method: 'upi' }],
              },
            },
            sequence: ['block.upi'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone,
        },
        notes: {
          localOrderId,
        },
        theme: {
          color: '#f59e0b',
        },
        handler: async (rzpResponse) => {
          try {
            const verifyResponse = await paymentService.verifyUpiPayment({
              ...rzpResponse,
              localOrderId,
            });
            navigate(`/order-success?orderId=${verifyResponse.data.order._id}&paymentMethod=UPI`);
          } catch (verifyError) {
            const message = verifyError.response?.data?.message || 'UPI verification failed.';
            setPayPalError(message);
          }
        },
        modal: {
          ondismiss: () => {
            setPayPalError('UPI payment was cancelled.');
          },
        },
        retry: {
          enabled: true,
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to start UPI payment.';
      setPayPalError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (selectedPaymentMethod === 'COD') {
      await handleCodOrder();
      return;
    }

    if (selectedPaymentMethod === 'UPI') {
      await handleUpiPayment();
      return;
    }

    setPayPalError('Use PayPal button below to complete payment securely.');
    paypalContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-amazon-light py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-amazon-blue mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-amazon-blue mb-4">Shipping Address</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="email"
                placeholder="Email"
                value={address.email}
                onChange={(e) => setAddress({ ...address, email: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Phone"
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Full Address"
                value={address.address}
                onChange={(e) => setAddress({ ...address, address: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="State"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="ZIP Code"
                value={address.zipCode}
                onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Country"
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                className="w-full px-4 py-2 border rounded"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
            <h2 className="text-2xl font-bold text-amazon-blue mb-4">Order Summary</h2>
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between mb-2 border-b pb-2">
                <span>{item.title} x {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity, selectedCurrency)}</span>
              </div>
            ))}
            <div className="flex justify-between mt-4 text-xl font-bold">
              <span>Total:</span>
              <span className="text-amazon-orange">{formatPrice(total, selectedCurrency)}</span>
            </div>

            <div className="mt-6 border-t pt-4">
              <label className="block mb-3 font-semibold text-lg text-amazon-blue">Select Payment Method</label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition" style={{borderColor: selectedPaymentMethod === 'PAYPAL' ? '#232f3e' : '#e5e7eb'}}>
                  <input
                    type="radio"
                    name="payment"
                    value="PAYPAL"
                    checked={selectedPaymentMethod === 'PAYPAL'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-semibold text-amazon-blue">PayPal</span>
                    <p className="text-xs text-gray-600">Secure online payment</p>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition" style={{borderColor: selectedPaymentMethod === 'UPI' ? '#232f3e' : '#e5e7eb'}}>
                  <input
                    type="radio"
                    name="payment"
                    value="UPI"
                    checked={selectedPaymentMethod === 'UPI'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-semibold text-amazon-blue">UPI (Razorpay)</span>
                    <p className="text-xs text-gray-600">Pay via UPI apps</p>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition" style={{borderColor: selectedPaymentMethod === 'COD' ? '#232f3e' : '#e5e7eb'}}>
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={selectedPaymentMethod === 'COD'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-semibold text-amazon-blue">💵 Cash on Delivery (COD)</span>
                    <p className="text-xs text-gray-600">Pay when you receive your order</p>
                  </div>
                </label>
              </div>
            </div>

            {selectedPaymentMethod !== 'PAYPAL' && (
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full mt-6 bg-amazon-orange hover:bg-orange-600 text-white font-bold py-3 rounded text-lg transition disabled:opacity-70"
              >
                {selectedPaymentMethod === 'COD' ? 'Place COD Order' : 'Pay via UPI'}
              </button>
            )}

            {selectedPaymentMethod === 'PAYPAL' && (
              <p className="mt-6 text-sm text-gray-700">Click the PayPal button below to complete payment.</p>
            )}

            {selectedPaymentMethod === 'PAYPAL' && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold text-amazon-blue mb-3">Pay with PayPal</h3>
              {paypalError && <p className="text-red-600 text-sm mb-2">{paypalError}</p>}
              {isProcessing && <p className="text-sm text-gray-600 mb-2">Processing payment...</p>}
              {!hasValidPayPalClientId && (
                <p className="text-sm text-red-600">Set REACT_APP_PAYPAL_CLIENT_ID to enable PayPal checkout.</p>
              )}
              <p className="text-xs text-gray-500 mb-2">Debug: {paypalDebug}</p>
              <div ref={paypalContainerRef} className="min-h-[48px]" />
            </div>
            )}

            {selectedPaymentMethod !== 'PAYPAL' && paypalError && (
              <p className="text-red-600 text-sm mt-4">{paypalError}</p>
            )}

            {selectedPaymentMethod === 'UPI' && !hasValidRazorpayKeyId && (
              <p className="text-sm text-red-600 mt-2">UPI uses backend Razorpay keys. If UPI fails, set valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
