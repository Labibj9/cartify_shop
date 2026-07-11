import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import Toast from '../../components/Toast';

function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [actionModal, setActionModal] = useState({ show: false, type: '', notes: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    phone: '',
    address: '',
    gstNumber: '',
    registrationNumber: '',
    isApproved: true,
  });

  useEffect(() => {
    fetchVendors();
  }, [page, status]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await adminService.getVendors({ page, limit: 10, status });
      setVendors(res.data.vendors || []);
    } catch (err) {
      showToast('Failed to fetch vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 2000);
  };

  const handleApprove = async () => {
    try {
      await adminService.approveVendor(selectedVendor._id, { notes: actionModal.notes });
      showToast('Vendor approved successfully', 'success');
      setActionModal({ show: false, type: '', notes: '' });
      setSelectedVendor(null);
      fetchVendors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve vendor', 'error');
    }
  };

  const handleReject = async () => {
    try {
      await adminService.rejectVendor(selectedVendor._id, { reason: actionModal.notes });
      showToast('Vendor rejected', 'success');
      setActionModal({ show: false, type: '', notes: '' });
      setSelectedVendor(null);
      fetchVendors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject vendor', 'error');
    }
  };

  const handleVerify = async () => {
    try {
      await adminService.verifyVendor(selectedVendor._id);
      showToast('Vendor verified successfully', 'success');
      setActionModal({ show: false, type: '', notes: '' });
      setSelectedVendor(null);
      fetchVendors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to verify vendor', 'error');
    }
  };

  const openActionModal = (vendor, type) => {
    setSelectedVendor(vendor);
    setActionModal({ show: true, type, notes: '' });
  };

  const closeActionModal = () => {
    setActionModal({ show: false, type: '', notes: '' });
  };

  const pendingVendorsCount = vendors.filter((vendor) => vendor?.isApproved === false).length;

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor and all their products?')) return;
    try {
      await adminService.deleteVendor(vendorId);
      showToast('Vendor deleted successfully', 'success');
      fetchVendors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete vendor', 'error');
    }
  };

  const resetVendorForm = () => {
    setVendorForm({
      name: '',
      email: '',
      password: '',
      businessName: '',
      phone: '',
      address: '',
      gstNumber: '',
      registrationNumber: '',
      isApproved: true,
    });
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await adminService.createVendor(vendorForm);
      showToast('Vendor created successfully', 'success');
      setShowCreateModal(false);
      resetVendorForm();
      fetchVendors();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create vendor', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading && vendors.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amazon-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast.message && <Toast message={toast.message} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Vendors Management</h2>
          <p className="text-gray-600 mt-1">Manage vendor accounts and approvals</p>
          {pendingVendorsCount > 0 && (
            <p className="text-sm text-yellow-700 mt-2">
              {pendingVendorsCount} pending vendor{pendingVendorsCount > 1 ? 's' : ''} waiting for approval.
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-amazon-orange text-white rounded-lg font-medium hover:bg-orange-600 transition"
        >
          + Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 items-center">
          <label className="font-medium text-gray-700">Filter by Status:</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amazon-orange"
          >
            <option value="all">All Vendors</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="verified">Verified</option>
          </select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Vendor Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Business</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Verified</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No vendors found
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{vendor.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{vendor.vendorProfile?.businessName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{vendor.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vendor.isApproved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {vendor.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vendor.vendorProfile?.isVerified
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {vendor.vendorProfile?.isVerified ? 'Verified ✓' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {!vendor.isApproved && (
                          <>
                            <button
                              onClick={() => openActionModal(vendor, 'approve')}
                              className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal(vendor, 'reject')}
                              className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {vendor.isApproved && !vendor.vendorProfile?.isVerified && (
                          <button
                            onClick={() => openActionModal(vendor, 'verify')}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(vendor._id)}
                          className="px-3 py-1 bg-gray-400 text-white rounded text-xs font-medium hover:bg-gray-500 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {actionModal.type === 'approve' && 'Approve Vendor'}
              {actionModal.type === 'reject' && 'Reject Vendor'}
              {actionModal.type === 'verify' && 'Verify Vendor'}
            </h3>
            <p className="text-gray-600 mb-4">Vendor: {selectedVendor?.name}</p>

            {(['approve', 'reject'].includes(actionModal.type)) && (
              <textarea
                value={actionModal.notes}
                onChange={(e) => setActionModal({ ...actionModal, notes: e.target.value })}
                placeholder={actionModal.type === 'approve' ? 'Optional approval notes...' : 'Reason for rejection...'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-amazon-orange"
                rows="3"
              />
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={closeActionModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (actionModal.type === 'approve') handleApprove();
                  else if (actionModal.type === 'reject') handleReject();
                  else if (actionModal.type === 'verify') handleVerify();
                }}
                className={`px-4 py-2 text-white rounded-lg transition ${
                  actionModal.type === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : actionModal.type === 'reject'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Vendor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Vendor</h3>

            <form onSubmit={handleCreateVendor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Vendor name"
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amazon-orange"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amazon-orange"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={vendorForm.password}
                onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amazon-orange"
                required
              />
              <input
                type="text"
                placeholder="Business name"
                value={vendorForm.businessName}
                onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amazon-orange"
                required
              />
              <input
                type="text"
                placeholder="Phone"
                value={vendorForm.phone}
                onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amazon-orange"
              />
              <input
                type="text"
                placeholder="Address"
                value={vendorForm.address}
                onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amazon-orange"
              />
              <input
                type="text"
                placeholder="GST Number"
                value={vendorForm.gstNumber}
                onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amazon-orange"
              />
              <input
                type="text"
                placeholder="Registration Number"
                value={vendorForm.registrationNumber}
                onChange={(e) => setVendorForm({ ...vendorForm, registrationNumber: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-amazon-orange"
              />

              <label className="md:col-span-2 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={vendorForm.isApproved}
                  onChange={(e) => setVendorForm({ ...vendorForm, isApproved: e.target.checked })}
                />
                Approve vendor immediately
              </label>

              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetVendorForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-amazon-orange text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminVendors;
