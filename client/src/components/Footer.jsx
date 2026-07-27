import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Scissors, ArrowRight, MapPin, Mail, Phone } from 'lucide-react';
import './Footer.css';

// Simple inline SVG social icons (lucide-react doesn't ship brand icons)
const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const IconFacebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconTwitter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">

          {/* Brand */}
          <div className="footer-brand-col">
            <div className="footer-logo">
              <Scissors size={18} />
              <span>Book<span className="footer-gold">MyBeauty</span></span>
            </div>
            <p className="footer-desc">
              Defining the next era of personal beauty through curated salon experiences and expert artistry. Discover, book, and enjoy — all in one place.
            </p>
            <div className="footer-socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-btn" aria-label="Instagram">
                <IconInstagram />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn" aria-label="Facebook">
                <IconFacebook />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-btn" aria-label="Twitter">
                <IconTwitter />
              </a>
            </div>
          </div>

          {/* Company */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Company</h4>
            <ul className="footer-link-list">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/salons">Explore Salons</Link></li>
              <li><Link to="/register?role=SALON_OWNER">List Your Salon</Link></li>
              <li><Link to="/contact">Careers</Link></li>
              <li><Link to="/contact">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Support</h4>
            <ul className="footer-link-list">
              <li><Link to="/contact">Help Center</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/contact">Terms of Service</Link></li>
              <li><Link to="/contact">FAQ</Link></li>
              <li><Link to="/register">Create Account</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer-newsletter-col">
            <h4 className="footer-col-title">Newsletter</h4>
            <p className="footer-newsletter-desc">
              Join our community for beauty insights, new salon announcements, and exclusive offers.
            </p>
            {subscribed ? (
              <div className="footer-subscribed">
                ✓ You're subscribed!
              </div>
            ) : (
              <form className="footer-input-group" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="Your email"
                  className="footer-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="footer-subscribe-btn" aria-label="Subscribe">
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
            <div className="footer-contact-info">
              <span><Mail size={13} /> support@BookMyBeauty.com</span>
              <span><Phone size={13} /> +1 (800) 725-6679</span>
              <span><MapPin size={13} /> New York, NY 10001</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-copy">© 2026 BookMyBeauty. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/salons">Explore</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
