import { useState, useEffect } from 'react';
import { Calendar, X, Clock, ShieldCheck, Eye, EyeOff, RefreshCw } from 'lucide-react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import './CustomerBookings.css';

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const toast = useToast();

  const load = async () => {
    try { const r = await api.get('/customer/booking'); setBookings(r.data.allBookings); }
    catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try { await api.patch(`/customer/booking/${id}/cancel`); toast('Booking cancelled'); load(); }
    catch (err) { toast(err.response?.data?.msg || 'Could not cancel', 'error'); }
  };

  const upcoming = bookings.filter((b) => ['PENDING', 'CONFIRMED'].includes(b.status));
  const past     = bookings.filter((b) => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.status));

  if (loading) return <div className="loader"><span className="spinner" /></div>;

  return (
    <div className="container cust-page">
      <div className="page-hd">
        <h1>My <span className="gold">Bookings</span></h1>
        <p>Track and manage your appointments</p>
      </div>

      {!bookings.length ? (
        <div className="empty">
          <Calendar size={40} />
          <h3>No bookings yet</h3>
          <p>Explore salons and book your first appointment.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="bk-group">
              <p className="bk-group-label">Upcoming</p>
              <div className="grid-3">
                {upcoming.map((b) => <BookingCard key={b.id} b={b} onCancel={cancel} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div className="bk-group">
              <p className="bk-group-label">History</p>
              <div className="grid-3">
                {past.map((b) => <BookingCard key={b.id} b={b} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookingCard({ b, onCancel }) {
  const [otp, setOtp]               = useState(null);
  const [otpVisible, setOtpVisible] = useState(false);
  const [otpExpiry, setOtpExpiry]   = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [minsLeft, setMinsLeft]     = useState(null); // null = available, >0 = not yet
  const toast = useToast();

  const isConfirmed = b.status === 'CONFIRMED';

  // Compute minutes until OTP window opens (appointment - 5 min)
  useEffect(() => {
    if (!isConfirmed) return;

    const calc = () => {
      const [h, m]   = b.startTime.split(':').map(Number);
      const appt     = new Date(b.date);
      appt.setHours(h, m, 0, 0);
      const ms = appt - Date.now() - 5 * 60 * 1000; // 5 min before appt
      if (ms > 0) {
        const totalMins  = Math.ceil(ms / 60000);
        const days  = Math.floor(totalMins / (60 * 24));
        const hrs   = Math.floor((totalMins % (60 * 24)) / 60);
        const mins  = totalMins % 60;
        setMinsLeft({ days, hrs, mins, totalMins });
      } else {
        setMinsLeft(null);
      }
    };

    calc();
    const timer = setInterval(calc, 30000); // refresh every 30 s
    return () => clearInterval(timer);
  }, [b.date, b.startTime, isConfirmed]);

  const fetchOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await api.get(`/customer/booking/${b.id}/otp`);
      setOtp(res.data.otp);
      setOtpExpiry(new Date(res.data.expiresAt));
      setOtpVisible(true);
      setMinsLeft(null);
    } catch (err) {
      const data = err.response?.data;
      if (data?.minutesUntilAvailable) {
        const totalMins = data.minutesUntilAvailable;
        const days = Math.floor(totalMins / (60 * 24));
        const hrs  = Math.floor((totalMins % (60 * 24)) / 60);
        const mins = totalMins % 60;
        setMinsLeft({ days, hrs, mins, totalMins });
      }
      toast(data?.msg || 'Could not load OTP', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpClick = () => {
    if (minsLeft) return; // window not open yet
    if (!otp) { fetchOtp(); return; }
    setOtpVisible((v) => !v);
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    setOtp(null); setOtpVisible(false);
    fetchOtp();
  };

  return (
    <div className={`bk-card card ${isConfirmed ? 'bk-confirmed' : ''}`}>

      {/* Header */}
      <div className="bk-card-top">
        <span className="bk-id">Booking #{b.id}</span>
        <span className={`badge badge-${b.status.toLowerCase()}`}>{b.status}</span>
      </div>

      {/* Details */}
      <div className="bk-card-body">
        <div className="bk-row">
          <Calendar size={14} />
          <span>
            {new Date(b.date).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
        <div className="bk-row">
          <Clock size={14} />
          <span>{b.startTime}</span>
        </div>
        {b.notes && <p className="bk-notes">"{b.notes}"</p>}
      </div>

      {/* ── OTP block — only on CONFIRMED bookings ── */}
      {isConfirmed && (
        <div className="bk-otp-wrap">
          <div className="bk-otp-label-row">
            <span className="bk-otp-label"><ShieldCheck size={13} /> Service OTP</span>
            {otp && !minsLeft && (
              <button className="bk-otp-refresh" onClick={handleRefresh}
                disabled={otpLoading} title="Regenerate OTP">
                <RefreshCw size={12} className={otpLoading ? 'spin' : ''} />
              </button>
            )}
          </div>

          {minsLeft ? (
            /* ── Not yet available ── */
            <div className="bk-otp-locked">
              <Clock size={15} />
              <span>OTP available in{' '}
                {minsLeft.days > 0 && <strong>{minsLeft.days}d </strong>}
                {minsLeft.hrs  > 0 && <strong>{minsLeft.hrs}h </strong>}
                {minsLeft.mins > 0 && <strong>{minsLeft.mins}m</strong>}
                {minsLeft.days === 0 && minsLeft.hrs === 0 && minsLeft.mins === 0 && <strong>less than a minute</strong>}
              </span>
            </div>
          ) : (
            /* ── Tap-to-reveal box ── */
            <button className="bk-otp-reveal" onClick={handleOtpClick} disabled={otpLoading}>
              {otpLoading ? (
                <span className="spinner" style={{ width: 18, height: 18 }} />
              ) : otpVisible && otp ? (
                <>
                  <span className="bk-otp-digits">
                    {otp.split('').map((d, i) => (
                      <span key={i} className="bk-otp-digit">{d}</span>
                    ))}
                  </span>
                  <EyeOff size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </>
              ) : (
                <>
                  <span className="bk-otp-digits bk-otp-masked">
                    {[0,1,2,3,4,5].map((i) => <span key={i} className="bk-otp-digit">•</span>)}
                  </span>
                  <Eye size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </>
              )}
            </button>
          )}

          <p className="bk-otp-hint">
            {minsLeft
              ? `OTP unlocks 5 minutes before your appointment (${minsLeft.days > 0 ? minsLeft.days + 'd ' : ''}${minsLeft.hrs > 0 ? minsLeft.hrs + 'h ' : ''}${minsLeft.mins}m remaining)`
              : otpVisible && otpExpiry
                ? `Show to salon staff · expires ${otpExpiry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Tap to reveal your OTP — show it to salon staff when you arrive'
            }
          </p>
        </div>
      )}

      {/* Cancel button */}
      {onCancel && ['PENDING', 'CONFIRMED'].includes(b.status) && (
        <button className="btn btn-danger btn-sm bk-cancel" onClick={() => onCancel(b.id)}>
          <X size={13} /> Cancel
        </button>
      )}
    </div>
  );
}
