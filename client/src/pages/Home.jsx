import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Scissors, MapPin, ArrowRight, Zap, Clock } from 'lucide-react';
import api from '../api';
import Footer from '../components/Footer';
import './Home.css';
import { useAuth } from '../context/AuthContext';

const categories = [
  { img: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=200&h=200&fit=crop&crop=center', name: 'Haircut',   work: 'HAIR'      },
  { img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop&crop=center', name: 'Beard',     work: 'BEARD'     },
  { img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=200&h=200&fit=crop&crop=center', name: 'Nails',     work: 'NAILS'     },
  { img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=200&h=200&fit=crop&crop=center', name: 'Facial',    work: 'FACIAL'    },
  { img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&h=200&fit=crop&crop=center', name: 'Massage',   work: 'MASSAGE'   },
  { img: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=200&h=200&fit=crop&crop=center', name: 'Makeup',    work: 'MAKEUP'    },
  { img: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop&crop=center', name: 'Skincare',  work: 'SKINCARE'  },
  { img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=200&h=200&fit=crop&crop=center', name: 'Threading', work: 'THREADING' },
];

const steps = [
  { n: '1', title: 'Find a Salon', desc: 'Search by city or browse top-rated salons near you.' },
  { n: '2', title: 'Choose a Service', desc: 'Compare services, prices, and available time slots.' },
  { n: '3', title: 'Book Instantly', desc: 'Confirm your appointment in seconds. No calls needed.' },
];

export default function Home() {
  const [salons, setSalons] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(true);
  const {isLoggedIn} = useAuth();

  useEffect(() => {
    api.get('/salons')
      .then((r) => setSalons(r.data.salons?.slice(0, 6) ?? []))
      .catch(() => setSalons([]))
      .finally(() => setSalonsLoading(false));
  }, []);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="hero-eyebrow"><Zap size={11} /> Premium Salon Booking</p>
            <h1 className="hero-title">Find &amp; Book Your<br /><span className="gold">Perfect Salon</span></h1>
            <p className="hero-sub">Discover top-rated salons in your city. Compare services, browse real-time slots, and book in seconds.</p>
            <div className="hero-actions">
              <Link to="/salons" className="btn btn-gold">Explore Salons <ArrowRight size={15} /></Link>
              {!isLoggedIn && <Link to="/register" className="btn btn-outline">Create Account</Link>}
              {isLoggedIn && <Link to="/customer/map" className="btn btn-outline">Salon Near You</Link>}
            </div>
          </div>
          {/* Hero visual — live top salons */}
          <div className="hero-visual">
            <p className="hero-card-title">Salons on BookMyBeauty</p>
            {salonsLoading ? (
              <div className="loader" style={{ padding: '20px 0' }}><span className="spinner" /></div>
            ) : salons.slice(0, 3).map((s) => (
              <Link to={`/salons/${s.userId}`} key={s.userId} className="hero-salon-item">
                <div className="hsi-icon">{s.salonName?.charAt(0)}</div>
                <div>
                  <p className="hsi-name">{s.salonName}</p>
                  <p className="hsi-meta"><MapPin size={11} /> {s.city}</p>
                </div>
                <span className="hsi-badge">Open</span>
              </Link>
            ))}
            {!salonsLoading && salons.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '12px 0' }}>No salons yet. Be the first!</p>
            )}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <p className="s-eyebrow">Browse by Service</p>
          <h2 className="s-title">What are you looking for?</h2>
          <div className="cat-grid">
            {categories.map((c) => (
              <Link to={`/salons?work=${c.work}`} key={c.name} className="cat-card">
                <div className="cat-img-wrap">
                  <img src={c.img} alt={c.name} className="cat-img" />
                  <div className="cat-overlay" />
                </div>
                <span className="cat-name">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Live Salons Section */}
      <section className="section section-white">
        <div className="container">
          <div className="home-salons-header">
            <div>
              <p className="s-eyebrow">Featured Salons</p>
              <h2 className="s-title" style={{ marginBottom: 0 }}>Salons near you</h2>
            </div>
            <Link to="/salons" className="btn btn-outline btn-sm">View all <ArrowRight size={13} /></Link>
          </div>

          {salonsLoading ? (
            <div className="loader"><span className="spinner" /> Loading salons...</div>
          ) : salons.length === 0 ? (
            <div className="home-no-salons">
              <p>No salons listed yet.</p>
              <Link to="/register?role=SALON_OWNER" className="btn btn-gold btn-sm" style={{ marginTop: 12 }}>
                Register Your Salon
              </Link>
            </div>
          ) : (
            <div className="home-salons-grid">
              {salons.map((s) => (
                <Link to={`/salons/${s.userId}`} key={s.userId} className="home-salon-card card">
                  <div className="hsc-img">
                    {s.profileUrl
                      ? <img src={s.profileUrl} alt={s.salonName} />
                      : <div className="hsc-placeholder">{s.salonName?.charAt(0)}</div>
                    }
                    <span className="hsc-badge">Open</span>
                  </div>
                  <div className="hsc-body">
                    <p className="hsc-name">{s.salonName}</p>
                    <p className="hsc-bio">{s.bio || 'Premium salon experience'}</p>
                    <div className="hsc-meta">
                      <span><MapPin size={12} /> {s.city}</span>
                      <span><Clock size={12} /> {s.openingTime}–{s.closingTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <p className="s-eyebrow">How it works</p>
          <h2 className="s-title">Book in 3 simple steps</h2>
          <div className="steps">
            {steps.map((s) => (
              <div key={s.n} className="step-card">
                <div className="step-num">{s.n}</div>
                <p className="step-title">{s.title}</p>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
