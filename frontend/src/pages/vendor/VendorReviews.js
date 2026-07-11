import React, { useEffect, useState } from 'react';
import { vendorService } from '../../services/api';
import { getProductImageUrl } from '../../utils/productImage';

function VendorReviews() {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setError('');
      const res = await vendorService.getVendorReviews();
      setReviews(res.data.reviews || []);
      setAverageRating(res.data.averageRating || 0);
      setCount(res.data.count || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const Stars = ({ value = 0 }) => {
    const full = Math.round(value);
    return (
      <span className="text-amber-400" aria-label={`${value} out of 5`}>
        {'★'.repeat(full)}
        <span className="text-gray-300">{'★'.repeat(5 - full)}</span>
      </span>
    );
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amazon-blue">Ratings &amp; Reviews</h1>
          <p className="text-gray-600 mt-1">See what customers are saying about your products.</p>
        </div>
        <button onClick={fetchReviews} className="rounded-lg bg-amazon-blue px-4 py-2 text-white">
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-wrap items-center gap-8">
        <div className="text-center">
          <p className="text-4xl font-bold text-amazon-orange">{averageRating.toFixed(1)}</p>
          <Stars value={averageRating} />
          <p className="text-sm text-gray-500 mt-1">Average rating</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold text-gray-900">{count}</p>
          <p className="text-sm text-gray-500 mt-1">Total reviews</p>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

      {reviews.length === 0 && !error ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xl text-gray-600">No reviews yet.</p>
          <p className="mt-2 text-sm text-gray-500">Reviews from customers will appear here once they rate your products.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review) => (
            <div key={review._id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                {review.product && (
                  <img
                    src={getProductImageUrl(review.product)}
                    alt={review.product.title}
                    className="h-12 w-12 rounded object-cover border border-gray-200"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{review.product?.title || 'Product'}</p>
                  <p className="text-sm text-gray-500">{review.user?.name || 'Customer'}</p>
                </div>
                <Stars value={review.rating} />
              </div>
              {review.title && <p className="mt-3 font-medium text-gray-800">{review.title}</p>}
              {review.comment && <p className="mt-1 text-sm text-gray-600">{review.comment}</p>}
              <p className="mt-3 text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VendorReviews;
