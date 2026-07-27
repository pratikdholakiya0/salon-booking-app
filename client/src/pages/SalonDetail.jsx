import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Scissors, Users, ChevronRight, CreditCard, Banknote, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import './SalonDetail.css';

// Dynamically load Razorpay checkout script
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Multi-step booking states
const STEP = { DETAILS: 'details', PAYMENT: 'payment', SUCCESS: 'success' };

export default function SalonDetail() {
  const { id } = useParams();
  const { isLoggedIn, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bkModal, setBkModal] = useState(false);
  const [selSvc, setSelSvc] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bk, setBk] = useState({ staffId: '', date: '', startTime: '', notes: '' });
  const [step, setStep] = useState(STEP.DETAILS);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [payMethod, setPayMethod] = useState('ONLINE');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    api.get(`/salons/${id}`).then((r) => setSalon(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id, isLoggedIn]);

  const fetchSlots = useCallback(() => {
    if (!bk.date) return;
    setSlotsLoading(true);
    const params = { salonId: id, date: bk.date };
    if (bk.staffId) params.staffId = bk.staffId;
    api.get('/salon/slots', { params })
      .then((r) => setSlots(r.data.freeSlots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [bk.date, bk.staffId, id]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const openBooking = (svc) => {
    if (!isLoggedIn) { toast('Please login to book', 'error'); navigate('/login'); return; }
    if (!user?.isEmailVerified) {
      toast('Please verify your email before booking.', 'error');
      navigate('/customer/profile');
      return;
    }
    setSelSvc(svc);
    setBk({ staffId: '', date: '', startTime: '', notes: '' });
    setSlots([]);
    setStep(STEP.DETAILS);
    setCreatedBooking(null);
    setBkModal(true);
  };

  const closeModal = () => {
    setBkModal(false);
    setStep(STEP.DETAILS);
    setCreatedBooking(null);
  };

  // Step 1 — create booking, advance to payment
  const submitBookingDetails = async (e) => {
    e.preventDefault();
    if (!bk.startTime) { toast('Please select a time slot', 'error'); return; }
    setSubmitting(true);
    try {
      const isoDate = new Date(bk.date + 'T00:00:00.000Z').toISOString();
      const res = await api.post('/customer/booking', {
        salonId: parseInt(id),
        serviceId: selSvc.id,
        staffId: bk.staffId ? parseInt(bk.staffId) : undefined,
        startTime: bk.startTime,
        date: isoDate,
        notes: bk.notes || undefined,
      });
      setCreatedBooking(res.data.booking);
      fetchSlots(); // refresh slots — the just-booked slot must not appear again
      setStep(STEP.PAYMENT);
    } catch (err) {
      toast(err.response?.data?.msg || 'Booking failed', 'error');
    } finally { setSubmitting(false); }
  };

  // Step 2 — handle payment
  const handlePayment = async () => {
    setSubmitting(true);
    try {
      if (payMethod === 'CASH') {
        await api.post('/customer/payment/cash', { bookingId: createdBooking.id });
        toast('Booking confirmed! Pay cash at the salon.');
        setStep(STEP.SUCCESS);
      } else {
        // Online — create Razorpay order
        const loaded = await loadRazorpay();
        if (!loaded) { toast('Failed to load payment gateway', 'error'); return; }

        const orderRes = await api.post('/customer/payment/order', { bookingId: createdBooking.id });
        const { orderId, amount, currency, keyId } = orderRes.data;

        const options = {
          key: keyId,
          amount,
          currency,
          name: salon.salonName,
          description: selSvc.name,
          order_id: orderId,
          handler: async (response) => {
            try {
              await api.post('/customer/payment/verify', {
                bookingId: createdBooking.id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              });
              toast('Payment successful!');
              setStep(STEP.SUCCESS);
            } catch {
              toast('Payment verification failed. Contact support.', 'error');
            }
          },
          prefill: {
            name:  user?.name  || '',
            email: user?.email || '',
            phone: user?.phone || '',
          },
          theme: { color: '#B8972E' },
          modal: {
            ondismiss: () => {
              toast('Payment cancelled', 'error');
              setSubmitting(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return; // don't reset submitting — handler will update step
      }
    } catch (err) {
      toast(err.response?.data?.msg || 'Payment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) return (
    <div className="container" style={{ padding: '72px 28px', textAlign: 'center' }}>
      <h2 style={{ marginBottom: 12 }}>Login to view salon details</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>You need an account to browse and book.</p>
      <button className="btn btn-gold" onClick={() => navigate('/login')}>Login</button>
    </div>
  );

  if (loading) return <div className="loader"><span className="spinner" /> Loading salon...</div>;
  if (!salon) return <div className="empty"><h3>Salon not found</h3></div>;

  return (
    <div className="salon-detail-page">
      {/* Header */}
      <div className="salon-detail-header">
        <div className="container sdh-inner">
          <div className="sdh-avatar">
            {salon.profileUrl ? <img src={salon.profileUrl} alt={salon.salonName} /> : <span>{salon.salonName?.charAt(0)}</span>}
          </div>
          <div>
            <h1 className="sdh-name">{salon.salonName}</h1>
            <p className="sdh-bio">{salon.bio || 'Premium salon experience'}</p>
            <div className="sdh-meta">
              <span><MapPin size={13} /> {salon.address}, {salon.city} {salon.pincode}</span>
              <span><Clock size={13} /> {salon.openingTime} – {salon.closingTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container salon-detail-body">

        {/* Unverified email warning banner */}
        {isLoggedIn && user?.role === 'CUSTOMER' && !user?.isEmailVerified && (
          <div className="sd-verify-banner">
            <AlertTriangle size={16} />
            <span>
              Your email is <strong>not verified</strong>. You cannot book appointments until you verify it.
            </span>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/customer/profile')}>
              Verify Now →
            </button>
          </div>
        )}
        {/* Services */}
        <div className="detail-sec">
          <h2 className="detail-sec-title"><Scissors size={18} className="gold" /> Services</h2>
          {!salon.services?.length
            ? <p className="text-muted text-sm">No services listed yet.</p>
            : <div className="services-grid">
                {salon.services.map((svc) => (
                  <div key={svc.id} className="svc-card card">
                    <span className="svc-work">{svc.work}</span>
                    <p className="svc-name">{svc.name}</p>
                    {svc.description && <p className="svc-desc">{svc.description}</p>}
                    <div className="svc-row">
                      <span className="svc-dur">{svc.duration} min</span>
                      <span className="svc-price">₹{svc.price}</span>
                    </div>
                    <button className="btn btn-gold btn-sm svc-book" onClick={() => openBooking(svc)}>
                      Book Now <ChevronRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Staff */}
        {salon.staff?.length > 0 && (
          <div className="detail-sec">
            <h2 className="detail-sec-title"><Users size={18} className="gold" /> Our Team</h2>
            <div className="staff-grid">
              {salon.staff.map((st) => (
                <div key={st.id} className="staff-card card">
                  <div className="staff-av">
                    {st.profileUrl ? <img src={st.profileUrl} alt={st.name} /> : <span>{st.name?.charAt(0)}</span>}
                  </div>
                  <div><p className="staff-name">{st.name}</p><p className="staff-role">{st.role}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Booking Modal ── */}
      {bkModal && selSvc && (
        <Modal
          title={
            step === STEP.DETAILS ? `Book: ${selSvc.name}` :
            step === STEP.PAYMENT ? 'Choose Payment Method' : 'Booking Confirmed!'
          }
          onClose={closeModal}
        >
          {/* ── Step 1: Booking Details ── */}
          {step === STEP.DETAILS && (
            <form onSubmit={submitBookingDetails}>
              <div className="bk-svc-info">
                <span className="text-muted">{selSvc.duration} min · {selSvc.work}</span>
                <span className="gold" style={{ fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>₹{selSvc.price}</span>
              </div>

              <div className="form-group">
                <label className="form-label">Staff (optional)</label>
                <select className="form-input" value={bk.staffId} onChange={(e) => setBk({ ...bk, staffId: e.target.value })}>
                  <option value="">Any available</option>
                  {salon.staff?.map((st) => <option key={st.id} value={st.id}>{st.name} — {st.role}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  max={(() => { const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })()}
                  value={bk.date}
                  onChange={(e) => setBk({ ...bk, startTime: '', date: e.target.value })} required />
                <p className="form-hint">Slots available for today and the next 2 days only.</p>
              </div>

              {bk.date && (
                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  {slotsLoading
                    ? <div className="loader" style={{ padding: 16 }}><span className="spinner" /></div>
                    : !slots.length
                      ? <p className="text-muted text-sm">No slots available for this date.</p>
                      : <div className="slots-grid">
                          {slots.map((sl) => (
                            <button key={sl.startTime} type="button"
                              className={`slot-btn ${bk.startTime === sl.startTime ? 'selected' : ''}`}
                              onClick={() => setBk({ ...bk, startTime: sl.startTime })}>
                              {sl.startTime}
                            </button>
                          ))}
                        </div>
                  }
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-input" rows={2} placeholder="Special requests..."
                  value={bk.notes} onChange={(e) => setBk({ ...bk, notes: e.target.value })} />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Please wait...</> : 'Next: Payment →'}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: Payment Method ── */}
          {step === STEP.PAYMENT && createdBooking && (
            <div>
              {/* Order summary */}
              <div className="pay-summary">
                <div className="pay-summary-row">
                  <span>Service</span><span>{selSvc.name}</span>
                </div>
                <div className="pay-summary-row">
                  <span>Date & Time</span><span>{bk.date} · {bk.startTime}</span>
                </div>
                <div className="pay-summary-row pay-summary-total">
                  <span>Total</span><span>₹{selSvc.price}</span>
                </div>
              </div>

              {/* Payment method choice */}
              <p className="form-label" style={{ marginBottom: 10 }}>Select Payment Method</p>
              <div className="pay-methods">
                <button
                  type="button"
                  className={`pay-method-btn ${payMethod === 'ONLINE' ? 'active' : ''}`}
                  onClick={() => setPayMethod('ONLINE')}
                >
                  <CreditCard size={20} />
                  <div>
                    <p className="pm-label">Pay Online</p>
                    <p className="pm-sub">UPI, Card, Net Banking via Razorpay</p>
                  </div>
                  {payMethod === 'ONLINE' && <span className="pm-check">✓</span>}
                </button>

                <button
                  type="button"
                  className={`pay-method-btn ${payMethod === 'CASH' ? 'active' : ''}`}
                  onClick={() => setPayMethod('CASH')}
                >
                  <Banknote size={20} />
                  <div>
                    <p className="pm-label">Pay at Salon</p>
                    <p className="pm-sub">Cash payment when you arrive</p>
                  </div>
                  {payMethod === 'CASH' && <span className="pm-check">✓</span>}
                </button>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline"
                  onClick={() => setStep(STEP.DETAILS)}>← Back</button>
                <button className="btn btn-gold" onClick={handlePayment} disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Processing...</>
                    : payMethod === 'ONLINE' ? `Pay ₹${selSvc.price}` : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === STEP.SUCCESS && (
            <div className="pay-success">
              <div className="pay-success-icon"><CheckCircle size={40} /></div>
              <h3>Booking Confirmed!</h3>
              <p>
                {payMethod === 'ONLINE'
                  ? 'Your payment was successful. The salon will confirm your appointment shortly.'
                  : 'Your booking is placed. Please pay cash when you arrive at the salon.'}
              </p>
              <div className="pay-success-details">
                <span>{selSvc.name}</span>
                <span>{bk.date} · {bk.startTime}</span>
                <span className="gold">₹{selSvc.price}</span>
              </div>
              <div className="modal-footer" style={{ justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={closeModal}>Close</button>
                <button className="btn btn-gold" onClick={() => { closeModal(); navigate('/customer/bookings'); }}>
                  View My Bookings
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
