import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Scissors, Eye, EyeOff } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

export default function Register() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'SALON_OWNER' ? 'SALON_OWNER' : 'CUSTOMER');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    salonName: '', address: '', city: '', pincode: '', openingTime: '09:00', closingTime: '20:00',
  });
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, role };
      // Server sets httpOnly cookies; no token in response body
      await api.post('/register', payload);
      // Fetch full user (including role) from DB via the new cookie
      const fullUser = await login();
      toast('Account created successfully!');
      navigate(fullUser?.role === 'SALON_OWNER' ? '/salon/dashboard' : '/salons');
    } catch (err) {
      toast(err.response?.data?.msg || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide card">
        <div className="auth-logo">
          <Scissors size={24} className="gold" />
          <span>Book<span className="gold">MyBeauty</span></span>
        </div>
        <h2 className="auth-title">Create account</h2>

        {/* Role Toggle */}
        <div className="role-toggle">
          <button type="button"
            className={`role-btn ${role === 'CUSTOMER' ? 'active' : ''}`}
            onClick={() => setRole('CUSTOMER')}>Customer</button>
          <button type="button"
            className={`role-btn ${role === 'SALON_OWNER' ? 'active' : ''}`}
            onClick={() => setRole('SALON_OWNER')}>Salon Owner</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input name="name" className="form-input" placeholder="John Doe"
                value={form.name} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input name="phone" className="form-input" placeholder="+1 234 567 890"
                value={form.phone} onChange={handle} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input name="email" type="email" className="form-input" placeholder="you@example.com"
              value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrap">
              <input name="password" type={show ? 'text' : 'password'} className="form-input"
                placeholder="••••••••" value={form.password} onChange={handle} required />
              <button type="button" className="input-eye" onClick={() => setShow(!show)}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {role === 'SALON_OWNER' && (
            <>
              <div className="divider" />
              <p className="form-section-label">Salon Details</p>
              <div className="form-group">
                <label className="form-label">Salon Name</label>
                <input name="salonName" className="form-input" placeholder="The Golden Cut"
                  value={form.salonName} onChange={handle} required />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input name="address" className="form-input" placeholder="123 Main Street"
                  value={form.address} onChange={handle} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input name="city" className="form-input" placeholder="New York"
                    value={form.city} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode</label>
                  <input name="pincode" className="form-input" placeholder="10001"
                    value={form.pincode} onChange={handle} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Opening Time</label>
                  <input name="openingTime" type="time" className="form-input"
                    value={form.openingTime} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Closing Time</label>
                  <input name="closingTime" type="time" className="form-input"
                    value={form.closingTime} onChange={handle} required />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-gold auth-btn" disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account...</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
