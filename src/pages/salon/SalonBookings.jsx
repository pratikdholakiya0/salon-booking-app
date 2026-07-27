import { useState, useEffect, useRef } from 'react';
import { Check, X, Calendar, Play, KeyRound, Star, UserX } from 'lucide-react';
import api from '../../api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import './SalonBookings.css';

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

export default function SalonBookings() {
  const [bookings, setBookings]     = useState([]);
  const [filter, setFilter]         = useState('ALL');
  const [loading, setLoading]       = useState(true);
  const [startModal, setStartModal] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying]   = useState(false);
  const inputRefs                   = useRef([]);
  const toast = useToast();

  const fetchBookings = async () => {
    try { const r = await api.get('/salon/booking'); setBookings(r.data.bookings); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  // Returns true if ≥15 min have elapsed since the booking's appointment start
  const isNoShowEligible = (b) => {
    if (b.status !== 'CONFIRMED') return false;
    const [h, m]   = b.startTime.split(':').map(Number);
    const apptTime = new Date(b.date);
    apptTime.setHours(h, m, 0, 0);
    return (Date.now() - apptTime) >= 15 * 60 * 1000;
  };

  const update = async (id, status) => {
    try { await api.patch(`/salon/booking/${id}`, { status }); toast(`Booking ${status.toLowerCase()}`); fetchBookings(); }
    catch (err) { toast(err.response?.data?.msg || 'Update failed', 'error'); }
  };

  const openStartModal = (booking) => {
    setActiveBooking(booking);
    setOtp(['', '', '', '', '', '']);
    setStartModal(true);
    // focus first box after render
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  };

  // Handle each digit box
  const handleDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;          // digits only
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
    // allow paste into first box
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) return;
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = [...otp];
    text.split('').forEach((d, i) => { if (i < 6) next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast('Enter all 6 digits', 'error'); return; }
    setVerifying(true);
    try {
      const res = await api.post(`/salon/booking/${activeBooking.id}/start`, { otp: code });
      if (res.data.late) {
        toast(`OTP verified! Customer was ${res.data.minsLate} min late — 5 pts deducted.`, 'warning');
      } else {
        toast('OTP verified — service started!');
      }
      setStartModal(false);
      fetchBookings();
    } catch (err) {
      toast(err.response?.data?.msg || 'Invalid OTP', 'error');
      // shake and clear on wrong OTP
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally { setVerifying(false); }
  };

  const visible = filter === 'ALL' ? bookings : bookings.filter((b) => b.status === filter);

  if (loading) return <div className="loader"><span className="spinner" /></div>;

  return (
    <div className="sb-page">
      <div className="page-hd">
        <h1>Bookings</h1>
        <p>Confirm requests and start services by verifying the customer's OTP</p>
      </div>

      <div className="sb-filters">
        {STATUSES.map((s) => (
          <button key={s} className={`filter-pill ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s}
            {s !== 'ALL' && <span className="filter-count">{bookings.filter((b) => b.status === s).length}</span>}
          </button>
        ))}
      </div>

      {!visible.length
        ? <div className="empty"><Calendar size={36} /><h3>No bookings found</h3></div>
        : <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th><th>Customer</th><th>Service</th><th>Date</th><th>Time</th><th>Status</th><th>Notes</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{b.id}</td>
                    <td>
                      <div className="sb-customer-cell">
                        <span className="sb-customer-name">{b.customer?.user?.name || '—'}</span>
                        <span className="sb-customer-phone">{b.customer?.user?.phone || ''}</span>
                      </div>
                      <div className="sb-loyalty-badge">
                        <Star size={11} className="gold" />
                        <span>{b.customer?.loyaltyScore ?? 0} pts</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{b.service?.name || '—'}</td>
                    <td>{new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td style={{ fontWeight: 600 }}>{b.startTime}</td>
                    <td><span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.notes || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {b.status === 'PENDING' && <>
                          <button className="btn btn-success btn-xs" onClick={() => update(b.id, 'CONFIRMED')}>
                            <Check size={12} /> Confirm
                          </button>
                          <button className="btn btn-danger btn-xs" onClick={() => update(b.id, 'CANCELLED')}>
                            <X size={12} />
                          </button>
                        </>}
                        {b.status === 'CONFIRMED' && (
                          <>
                            <button className="btn btn-xs sb-start-btn" onClick={() => openStartModal(b)}>
                              <Play size={12} /> Start Service
                            </button>
                            {isNoShowEligible(b) && (
                              <button
                                className="btn btn-xs btn-danger"
                                title="Customer did not appear after 15 minutes"
                                onClick={() => {
                                  if (confirm(`Mark booking #${b.id} as No Show? This will deduct 20 loyalty points from the customer.`)) {
                                    update(b.id, 'NO_SHOW');
                                  }
                                }}
                              >
                                <UserX size={12} /> No Show
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }

      {/* ── OTP Modal — salon types customer's code ── */}
      {startModal && activeBooking && (
        <Modal title="Enter Customer OTP" onClose={() => setStartModal(false)}>
          <div className="sb-otp-info">
            <div className="sb-otp-info-row">
              <span>Booking</span><span>#{activeBooking.id}</span>
            </div>
            <div className="sb-otp-info-row">
              <span>Time</span>
              <span>{new Date(activeBooking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {activeBooking.startTime}</span>
            </div>
          </div>

          <div className="sb-otp-prompt">
            <KeyRound size={18} className="gold" />
            <p>Ask the customer to open their booking card and share their OTP with you.</p>
          </div>

          {/* 6-box OTP input */}
          <div className="sb-otp-boxes" onPaste={handlePaste}>
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                className="sb-otp-box"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline" onClick={() => setStartModal(false)}>Cancel</button>
            <button
              className="btn btn-gold"
              onClick={handleVerify}
              disabled={verifying || otp.join('').length !== 6}
            >
              {verifying ? <><span className="spinner" /> Verifying...</> : <><Play size={14} /> Start Service</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
