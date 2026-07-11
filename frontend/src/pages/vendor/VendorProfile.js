import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { vendorService } from '../../services/api';
import { setAuth } from '../../redux/authSlice';
import Toast from '../../components/Toast';

function VendorProfile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: '',
    email: '',
    businessName: '',
    phone: '',
    address: '',
    gstNumber: '',
    registrationNumber: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      businessName: user?.vendorProfile?.businessName || '',
      phone: user?.vendorProfile?.phone || '',
      address: user?.vendorProfile?.address || '',
      gstNumber: user?.vendorProfile?.gstNumber || '',
      registrationNumber: user?.vendorProfile?.registrationNumber || '',
      description: user?.vendorProfile?.description || '',
    });
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 2200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await vendorService.updateProfile(form);
      dispatch(setAuth({ user: res.data.user || { ...user, ...form } }));
      showToast('Profile updated.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast.message && <Toast message={toast.message} type={toast.type} />}
      <div>
        <h2 className="text-3xl font-bold text-amazon-blue">Vendor Profile</h2>
        <p className="text-gray-600 mt-1">Manage your seller account details and business information.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="GST number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Registration number" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
          <textarea className="md:col-span-2 rounded-lg border border-gray-300 px-3 py-2" rows="3" placeholder="Business description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-amazon-blue px-4 py-2 font-semibold text-white disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VendorProfile;
