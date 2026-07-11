import React, { useEffect, useState } from 'react';
import Toast from '../../components/Toast';

function VendorOperations() {
  const [offers, setOffers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [offerForm, setOfferForm] = useState({ name: '', code: '', discount: '', expiry: '' });

  useEffect(() => {
    const savedOffers = JSON.parse(localStorage.getItem('vendorOffers') || 'null');
    const savedReviews = JSON.parse(localStorage.getItem('vendorReviews') || 'null');
    const savedRefunds = JSON.parse(localStorage.getItem('vendorRefunds') || 'null');
    setOffers(savedOffers || [
      { id: 1, name: 'Summer Sale', code: 'SUMMER10', discount: '10%', expiry: '2026-08-31', active: true },
    ]);
    setReviews(savedReviews || [
      { id: 1, customer: 'Asha', comment: 'Fast delivery and great packaging.', status: 'Pending Reply' },
    ]);
    setRefunds(savedRefunds || [
      { id: 1, customer: 'Mina', reason: 'Received damaged item', status: 'Under Review' },
    ]);
  }, []);

  useEffect(() => {
    localStorage.setItem('vendorOffers', JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem('vendorReviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('vendorRefunds', JSON.stringify(refunds));
  }, [refunds]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 2200);
  };

  const handleAddOffer = (e) => {
    e.preventDefault();
    if (!offerForm.name || !offerForm.code || !offerForm.discount) {
      showToast('Please fill required fields.', 'error');
      return;
    }
    setOffers([...offers, { id: Date.now(), ...offerForm, active: true }]);
    setOfferForm({ name: '', code: '', discount: '', expiry: '' });
    showToast('Coupon added.');
  };

  const handleReviewReply = (reviewId) => {
    setReviews(reviews.map((review) => review.id === reviewId ? { ...review, status: 'Responded' } : review));
    showToast('Review updated.');
  };

  const handleRefundUpdate = (refundId) => {
    setRefunds(refunds.map((refund) => refund.id === refundId ? { ...refund, status: 'Approved' } : refund));
    showToast('Refund request updated.');
  };

  return (
    <div className="space-y-6">
      {toast.message && <Toast message={toast.message} type={toast.type} />}
      <div>
        <h2 className="text-3xl font-bold text-amazon-blue">Operations Center</h2>
        <p className="text-gray-600 mt-1">Run promotional offers, manage customer feedback, and handle returns.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Coupons & Offers</h3>
          <form onSubmit={handleAddOffer} className="space-y-3">
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Offer name" value={offerForm.name} onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })} />
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Coupon code" value={offerForm.code} onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value })} />
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Discount value" value={offerForm.discount} onChange={(e) => setOfferForm({ ...offerForm, discount: e.target.value })} />
            <input type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2" value={offerForm.expiry} onChange={(e) => setOfferForm({ ...offerForm, expiry: e.target.value })} />
            <button type="submit" className="rounded-lg bg-amazon-orange px-4 py-2 font-semibold text-white">Create Offer</button>
          </form>
          <div className="mt-4 space-y-2">
            {offers.map((offer) => (
              <div key={offer.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{offer.name}</p>
                    <p className="text-sm text-gray-500">Code: {offer.code} • {offer.discount}</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Reviews & Customer Queries</h3>
            <div className="space-y-2">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{review.customer}</p>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                    <button onClick={() => handleReviewReply(review.id)} className="rounded bg-blue-600 px-3 py-1 text-sm text-white">Reply</button>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-gray-500">{review.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Returns & Refunds</h3>
            <div className="space-y-2">
              {refunds.map((refund) => (
                <div key={refund.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{refund.customer}</p>
                      <p className="text-sm text-gray-600">{refund.reason}</p>
                    </div>
                    <button onClick={() => handleRefundUpdate(refund.id)} className="rounded bg-green-600 px-3 py-1 text-sm text-white">Approve</button>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-gray-500">{refund.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorOperations;
