import { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '../components/Footer';
import './Contact.css';

const faqs = [
  { q: 'How do I book an appointment?',           a: 'Browse salons on the Explore page, pick a service, choose a date and available time slot, then hit Confirm Booking. You need a free account to book.' },
  { q: 'Is BookMyBeauty free to use?',             a: 'Yes — creating an account and booking is completely free for customers. Salon owners can also register and list their salon at no charge.' },
  { q: 'How do I register my salon?',             a: 'Click "Get Started" and choose the Salon Owner option. Fill in your salon details, opening hours, and you\'ll have access to your dashboard immediately.' },
  { q: 'Can I cancel a booking?',                 a: 'Yes. Go to My Bookings, find the appointment, and click Cancel. You can cancel any booking that is still in PENDING or CONFIRMED status.' },
  { q: 'How are time slots generated?',           a: 'Slots are generated automatically based on the salon\'s opening/closing hours and their chosen slot interval (e.g. every 30 min). Booked slots are excluded in real time.' },
  { q: 'What if I have a problem with a salon?',  a: 'Use the contact form on this page or email us at support@BookMyBeauty.com. We take every report seriously and will follow up within 24 hours.' },
];

const contactInfo = [
  { icon: <Mail size={18} />,   label: 'Email',          value: 'support@BookMyBeauty.com' },
  { icon: <Phone size={18} />,  label: 'Phone',          value: '+1 (800) 725-6679' },
  { icon: <MapPin size={18} />, label: 'Head Office',    value: '123 Style Avenue, New York, NY 10001' },
  { icon: <Clock size={18} />,  label: 'Support Hours',  value: 'Mon–Fri, 9 AM – 6 PM EST' },
];

export default function Contact() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="contact-page">

      {/* Hero */}
      <section className="contact-hero">
        <div className="container">
          <p className="s-eyebrow">Get in Touch</p>
          <h1 className="contact-title">We'd love to <span className="gold">hear from you</span></h1>
          <p className="contact-sub">
            Have a question, found a bug, want to partner with us, or just want to say hello?
            Our team is here and will get back to you quickly.
          </p>
        </div>
      </section>

      {/* Contact info cards */}
      <div className="container contact-info-row">
        {contactInfo.map((c) => (
          <div key={c.label} className="contact-info-card card">
            <div className="ci-icon">{c.icon}</div>
            <div>
              <p className="ci-label">{c.label}</p>
              <p className="ci-value">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form + FAQ split */}
      <div className="container contact-body">

        {/* Message form */}
        <div className="card contact-form-card">
          <div className="contact-form-hd">
            <MessageSquare size={20} className="gold" />
            <h2 className="contact-form-title">Send a Message</h2>
          </div>

          {sent ? (
            <div className="contact-success">
              <div className="cs-icon">✓</div>
              <h3>Message sent!</h3>
              <p>Thanks for reaching out. We'll reply to <strong>{form.email}</strong> within 24 hours.</p>
              <button className="btn btn-outline btn-sm" style={{ marginTop: 18 }}
                onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input name="name" className="form-input" placeholder="Jane Doe"
                    value={form.name} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input name="email" type="email" className="form-input" placeholder="you@example.com"
                    value={form.email} onChange={handle} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select name="subject" className="form-input" value={form.subject} onChange={handle} required>
                  <option value="">Select a topic…</option>
                  <option>General Inquiry</option>
                  <option>Booking Issue</option>
                  <option>Salon Registration</option>
                  <option>Account Problem</option>
                  <option>Partnership / Press</option>
                  <option>Bug Report</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea name="message" className="form-input" rows={5}
                  placeholder="Tell us what's on your mind…"
                  value={form.message} onChange={handle} required />
              </div>
              <button type="submit" className="btn btn-gold" disabled={sending}>
                <Send size={14} /> {sending ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* FAQ */}
        <div className="contact-faq">
          <p className="s-eyebrow">FAQ</p>
          <h2 className="contact-faq-title">Common Questions</h2>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{f.q}</span>
                  {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {openFaq === i && <p className="faq-answer">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
