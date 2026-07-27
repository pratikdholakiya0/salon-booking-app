import { useEffect, useState } from 'react';
import { Scissors, Users, Calendar, MapPin, ShieldCheck, Zap, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';
import Footer from '../components/Footer';
import './About.css';

const team = [
  { name: 'Priya Sharma',  role: 'CEO & Co-Founder',      avatar: 'P', bio: 'Passionate about connecting people with great beauty experiences.' },
  { name: 'Rahul Mehta',   role: 'CTO & Co-Founder',      avatar: 'R', bio: 'Building the technology that powers BookMyBeauty end-to-end.' },
  { name: 'Anaya Patel',   role: 'Head of Design',        avatar: 'A', bio: 'Crafting beautiful, intuitive interfaces for every user.' },
  { name: 'Karan Joshi',   role: 'Head of Partnerships',  avatar: 'K', bio: 'Helping salons grow their business through our platform.' },
];

const values = [
  { icon: <ShieldCheck size={22} />, title: 'Transparency',  desc: 'Real reviews, real prices, no hidden fees. What you see is exactly what you get.' },
  { icon: <Zap size={22} />,         title: 'Convenience',   desc: 'Book anytime, anywhere in seconds. No phone calls, no waiting on hold.' },
  { icon: <Star size={22} />,        title: 'Quality',       desc: 'Every salon on our platform is verified and held to the highest standards.' },
  { icon: <Users size={22} />,       title: 'Community',     desc: 'We empower salon owners to grow and help customers find their perfect match.' },
];

export default function About() {
  const [salonCount, setSalonCount] = useState(null);

  useEffect(() => {
    api.get('/salons')
      .then((r) => setSalonCount(r.data.salons?.length ?? 0))
      .catch(() => setSalonCount(0));
  }, []);

  const stats = [
    { num: salonCount !== null ? `${salonCount}+` : '—', label: 'Salons Listed',    icon: <MapPin size={14} /> },
    { num: '3',                                           label: 'User Roles',       icon: <Users size={14} /> },
    { num: 'Real-time',                                   label: 'Slot Availability',icon: <Calendar size={14} /> },
    { num: 'Free',                                        label: 'To Register',      icon: <Scissors size={14} /> },
  ];

  return (
    <div className="about-page">

      {/* Hero */}
      <section className="about-hero">
        <div className="container">
          <p className="s-eyebrow">About BookMyBeauty</p>
          <h1 className="about-title">
            We connect people with<br /><span className="gold">great salons</span>
          </h1>
          <p className="about-sub">
            BookMyBeauty was built out of frustration — booking a salon appointment was harder than it needed to be.
            We built the platform we wished existed: fast, transparent, and beautiful.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <Link to="/salons" className="btn btn-gold">Explore Salons <ArrowRight size={14} /></Link>
            <Link to="/register?role=SALON_OWNER" className="btn btn-outline">List Your Salon</Link>
          </div>
        </div>
      </section>

      {/* Live stats bar */}
      <div className="about-stats-bar">
        <div className="container about-stats-inner">
          {stats.map((s, i) => (
            <>
              <div key={s.label} className="about-stat">
                <span className="about-stat-num">{s.num}</span>
                <span className="about-stat-label">{s.icon} {s.label}</span>
              </div>
              {i < stats.length - 1 && <div className="about-stat-divider" key={`d${i}`} />}
            </>
          ))}
        </div>
      </div>

      {/* Story */}
      <section className="section">
        <div className="container about-story-grid">
          <div>
            <p className="s-eyebrow">Our Story</p>
            <h2 className="about-section-title">Built for the modern beauty consumer</h2>
            <p className="about-body-text">
              BookMyBeauty started in 2024 with a simple idea: make it as easy to book a haircut as it is to order food. 
              We noticed that customers were still calling salons, waiting on hold, and dealing with double bookings. 
              Salon owners were managing paper diaries and struggling to retain customers.
            </p>
            <p className="about-body-text" style={{ marginTop: 14 }}>
              We built BookMyBeauty to solve both problems at once — a unified platform where customers can discover 
              and book in seconds, and salon owners get a full dashboard to manage bookings, staff, and services 
              without the chaos.
            </p>
          </div>
          <div className="about-story-cards">
            <div className="card about-story-card">
              <div className="asc-icon"><Scissors size={20} /></div>
              <p className="asc-title">For Customers</p>
              <p className="asc-desc">Browse salons by service, city, and availability. Book in seconds with real-time slot confirmation.</p>
            </div>
            <div className="card about-story-card">
              <div className="asc-icon asc-icon-2"><Users size={20} /></div>
              <p className="asc-title">For Salon Owners</p>
              <p className="asc-desc">Manage bookings, staff, and services from a powerful dashboard. Grow your business effortlessly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" style={{ background: 'var(--white)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <p className="s-eyebrow">What we stand for</p>
          <h2 className="about-section-title">Our Core Values</h2>
          <div className="grid-4" style={{ marginTop: 28 }}>
            {values.map((v) => (
              <div key={v.title} className="card value-card">
                <div className="value-icon">{v.icon}</div>
                <h3 className="value-title">{v.title}</h3>
                <p className="value-desc">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <div className="container">
          <p className="s-eyebrow">The people behind it</p>
          <h2 className="about-section-title">Meet the Team</h2>
          <div className="team-grid">
            {team.map((m) => (
              <div key={m.name} className="card team-card">
                <div className="team-avatar">{m.avatar}</div>
                <p className="team-name">{m.name}</p>
                <p className="team-role">{m.role}</p>
                <p className="team-bio">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="about-cta card">
            <Scissors size={32} className="gold" style={{ marginBottom: 12 }} />
            <h2 style={{ fontSize: '1.6rem', marginBottom: 10 }}>Ready to get started?</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 24px', fontSize: '0.9rem', lineHeight: 1.7 }}>
              Join thousands of customers who book smarter, and hundreds of salon owners who grow faster with BookMyBeauty.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-gold">Create Account</Link>
              <Link to="/contact" className="btn btn-outline">Get in Touch</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
