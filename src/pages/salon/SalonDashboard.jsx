import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Scissors, Users, TrendingUp, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../../api';
import './SalonDashboard.css';

export default function SalonDashboard() {
  const [salon, setSalon] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/salon/profile'),
      api.get('/salon/booking'),
      api.get('/salon/service'),
      api.get('/salon/staff'),
    ]).then(([s, b, svc, st]) => {
      setSalon(s.data);
      setBookings(b.data.bookings);
      setServices(svc.data.serviceData);
      setStaff(st.data.staffData);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader"><span className="spinner" /> Loading...</div>;

  const pending   = bookings.filter((b) => b.status === 'PENDING').length;
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
  const total     = bookings.length;

  const recent = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  const stats = [
    { label: 'Total Bookings', value: total,     icon: <Calendar size={20} />, color: '#B8972E', bg: '#FEF9EA' },
    { label: 'Pending',        value: pending,   icon: <AlertCircle size={20} />, color: '#D97706', bg: '#FEF3C7' },
    { label: 'Confirmed',      value: confirmed, icon: <CheckCircle size={20} />, color: '#2E7D4F', bg: '#EBF5EE' },
    { label: 'Completed',      value: completed, icon: <TrendingUp size={20} />, color: '#2563EB', bg: '#EFF4FF' },
  ];

  return (
    <div className="dash-page">
      {/* Welcome */}
      <div className="dash-welcome">
        <div>
          <h1 className="dash-salon-name">{salon?.salonName}</h1>
          <p className="dash-salon-meta">
            <Clock size={13} /> {salon?.openingTime} – {salon?.closingTime} &nbsp;·&nbsp;
            <span className={`badge ${salon?.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>{salon?.isActive ? 'Active' : 'Inactive'}</span>
          </p>
        </div>
        <Link to="/salon/profile" className="btn btn-outline btn-sm">Edit Profile</Link>
      </div>

      {/* Stats */}
      <div className="grid-4 dash-stats">
        {stats.map((s) => (
          <div key={s.label} className="stat-card card">
            <div className="sc-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="sc-body">
              <p className="sc-val">{s.value}</p>
              <p className="sc-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* Recent bookings table */}
        <div className="card dash-table-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Recent Bookings</h3>
            <Link to="/salon/bookings" className="btn btn-ghost btn-sm">View all <ArrowRight size={13} /></Link>
          </div>
          {!recent.length
            ? <p className="text-muted text-sm">No bookings yet.</p>
            : <table className="tbl">
                <thead>
                  <tr>
                    <th>ID</th><th>Date</th><th>Time</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((b) => (
                    <tr key={b.id}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{b.id}</td>
                      <td>{new Date(b.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td>{b.startTime}</td>
                      <td><span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

        {/* Quick links */}
        <div className="dash-quick">
          <h3 className="dash-card-title" style={{ marginBottom: 14 }}>Quick Access</h3>
          {[
            { to: '/salon/bookings', icon: <Calendar size={18} />, label: 'Manage Bookings', sub: `${pending} pending` },
            { to: '/salon/services', icon: <Scissors size={18} />, label: 'Manage Services', sub: `${services.length} listed` },
            { to: '/salon/staff',    icon: <Users size={18} />,    label: 'Manage Staff',    sub: `${staff.length} members` },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="ql-card card">
              <div className="ql-icon">{l.icon}</div>
              <div className="ql-text">
                <p className="ql-label">{l.label}</p>
                <p className="ql-sub">{l.sub}</p>
              </div>
              <ArrowRight size={15} className="ql-arrow" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
