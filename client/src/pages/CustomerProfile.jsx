import { useState, useEffect } from 'react';
import { Save, Star, Mail, Phone, ShieldCheck, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import './CustomerProfile.css';

export default function CustomerProfile() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', profileUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/customer/profile'), api.get('/user')])
      .then(([p, u]) => {
        setProfile(p.data);
        setUserData(u.data);
        setForm({ name: u.data.name, phone: u.data.phone, profileUrl: p.data.profileUrl || '' });
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/customer/profile', form);
      toast('Profile updated!');
    } catch (err) {
      toast(err.response?.data?.msg || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: userData?.email });
      toast('Verification email sent! Check your inbox.');
    } catch (err) {
      toast(err.response?.data?.msg || 'Failed to send', 'error');
    } finally {
      setResending(false);
    }
  };

  if (loading) return <div className="loader"><span className="spinner" /></div>;

  return (
    <div className="container cust-page">
      <div className="page-hd">
        <h1>My <span className="gold">Profile</span></h1>
        <p>Manage your account details</p>
      </div>

      {/* ── Email verification banner ── */}
      {userData && (
        userData.isEmailVerified ? (
          <div className="cp-verified-banner">
            <CheckCircle size={16} color="#22a86e" />
            <span>Your email is verified. You can book appointments.</span>
          </div>
        ) : (
          <div className="cp-verify-banner">
            <AlertTriangle size={18} />
            <div className="cp-verify-text">
              <strong>Email not verified — you cannot book appointments.</strong>
              <span>We sent a link to <em>{userData.email}</em>. Check your inbox or spam.</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={resend} disabled={resending}>
              {resending ? <><span className="spinner" /> Sending…</> : 'Resend Email'}
            </button>
          </div>
        )
      )}

      <div className="cp-layout">
        {/* Left — user info card */}
        <div className="cp-left">
          {/* Avatar + summary */}
          <div className="card cp-id-card">
            <div className="cp-avatar-wrap">
              {form.profileUrl
                ? <img src={form.profileUrl} alt="avatar" className="cp-avatar-img" />
                : <div className="cp-avatar-ph">
                    <span>{userData?.name?.charAt(0)?.toUpperCase()}</span>
                  </div>
              }
            </div>
            <p className="cp-name">{userData?.name}</p>
            <p className="cp-role-badge">Customer</p>

            <div className="cp-info-list">
              <div className="cp-info-row">
                <Mail size={14} />
                <span>{userData?.email}</span>
              </div>
              <div className="cp-info-row">
                <Phone size={14} />
                <span>{userData?.phone || 'Not set'}</span>
              </div>
              <div className="cp-info-row">
                <ShieldCheck size={14} />
                <span>Member since {new Date(userData?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {profile && (
              <div className="cp-loyalty">
                <Star size={13} className="gold" />
                <span>{profile.loyaltyScore} Loyalty Points</span>
              </div>
            )}
          </div>

          {/* Quick link to bookings */}
          <Link to="/customer/bookings" className="card cp-bookings-link">
            <Calendar size={18} className="gold" />
            <div>
              <p className="cpbl-label">My Bookings</p>
              <p className="cpbl-sub">View and manage appointments</p>
            </div>
            <span className="cpbl-arrow">→</span>
          </Link>
        </div>

        {/* Right — edit form */}
        <div className="card cp-form">
          <h3 className="cp-form-title">Edit Profile</h3>
          <p className="cp-form-sub">Update your personal information</p>

          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={userData?.email} disabled
                style={{ opacity: 0.55, cursor: 'not-allowed' }} />
              <p className="form-hint">Email cannot be changed</p>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" placeholder="+1 234 567 890"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>

            <div className="form-group">
              <ImageUpload
                label="Profile Photo"
                value={form.profileUrl}
                onChange={(url) => setForm({ ...form, profileUrl: url })}
                shape="circle"
                size={88}
              />
            </div>

            <div className="divider" />

            <button type="submit" className="btn btn-gold" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
