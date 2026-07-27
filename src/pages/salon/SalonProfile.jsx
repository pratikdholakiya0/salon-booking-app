import { useState, useEffect } from 'react';
import { Save, Store } from 'lucide-react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import ImageUpload from '../../components/ImageUpload';
import './SalonProfile.css';

export default function SalonProfile() {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '', phone: '', salonName: '', bio: '', profileUrl: '',
    address: '', city: '', pincode: '', openingTime: '', closingTime: '', slotInterval: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/salon/profile'), api.get('/user')]).then(([s, u]) => {
      setForm({
        name: u.data.name || '', phone: u.data.phone || '',
        salonName: s.data.salonName || '', bio: s.data.bio || '',
        profileUrl: s.data.profileUrl || '', address: s.data.address || '',
        city: s.data.city || '', pincode: s.data.pincode || '',
        openingTime: s.data.openingTime || '', closingTime: s.data.closingTime || '',
        slotInterval: s.data.slotInterval || 30,
      });
    }).finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await api.patch('/salon/profile', form); toast('Profile saved!'); }
    catch (err) { toast(err.response?.data?.msg || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loader"><span className="spinner" /></div>;

  return (
    <div className="sp-page">
      <div className="page-hd"><h1>Settings</h1><p>Update your salon profile and business hours</p></div>

      <form onSubmit={save} className="sp-layout">
        {/* Left column */}
        <div>
          <div className="card sp-section">
            <div className="sp-section-title"><Store size={16} className="gold" /> Owner Info</div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input className="form-input" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={set('phone')} required />
              </div>
            </div>
          </div>

          <div className="card sp-section">
            <div className="sp-section-title">Salon Details</div>
            <div className="form-group">
              <label className="form-label">Salon Name</label>
              <input className="form-input" value={form.salonName} onChange={set('salonName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Bio / Description</label>
              <textarea className="form-input" rows={3} value={form.bio} onChange={set('bio')} placeholder="Describe your salon experience..." />
            </div>
            <div className="form-group">
              <ImageUpload
                label="Salon Profile Photo"
                value={form.profileUrl}
                onChange={(url) => setForm({ ...form, profileUrl: url })}
                shape="square"
                size={88}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={set('address')} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={form.city} onChange={set('city')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode</label>
                <input className="form-input" value={form.pincode} onChange={set('pincode')} />
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="card sp-section">
            <div className="sp-section-title">Business Hours</div>
            <div className="form-group">
              <label className="form-label">Opening Time</label>
              <input type="time" className="form-input" value={form.openingTime} onChange={set('openingTime')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Closing Time</label>
              <input type="time" className="form-input" value={form.closingTime} onChange={set('closingTime')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Slot Interval (minutes)</label>
              <select className="form-input" value={form.slotInterval} onChange={(e) => setForm({ ...form, slotInterval: parseInt(e.target.value) })}>
                {[15,20,30,45,60].map((v) => <option key={v} value={v}>{v} minutes</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-gold" style={{ width: '100%', justifyContent: 'center', padding: 13 }} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
