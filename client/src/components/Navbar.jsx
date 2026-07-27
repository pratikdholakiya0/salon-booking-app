import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scissors, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Salon owners use the sidebar — hide public navbar entirely for them
  if (isLoggedIn && user?.role === 'SALON_OWNER') return null;

  const handleLogout = () => { logout(); navigate('/'); setOpen(false); };
  const close = () => setOpen(false);

  // Always-visible public links
  const publicLinks = [
    { to: '/',        label: 'Home'     },
    { to: '/salons',  label: 'Explore'  },
    { to: '/about',   label: 'About'    },
    { to: '/contact', label: 'Contact'  },
  ];

  // Extra links when logged in as CUSTOMER
  const customerLinks = [
    { to: '/customer/bookings', label: 'My Bookings' },
    { to: '/profile',           label: 'Profile'     },
  ];

  const navLinks = isLoggedIn
    ? [...publicLinks, ...customerLinks]
    : publicLinks;

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo" onClick={close}>
          <Scissors size={20} className="logo-icon" />
          Book<span className="gold">MyBeauty</span>
        </Link>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to}
              className={`nav-link ${location.pathname === l.to ? 'active' : ''}`}
              onClick={close}>
              {l.label}
            </Link>
          ))}

          {!isLoggedIn ? (
            <div className="nav-auth-btns">
              <Link to="/login"    className="btn btn-outline btn-sm" onClick={close}>Login</Link>
              <Link to="/register" className="btn btn-gold btn-sm"    onClick={close}>Get Started</Link>
            </div>
          ) : (
            <div className="nav-user">
              <div className="nav-user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
              <span className="nav-user-name">{user?.name?.split(' ')[0]}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>

        <button className="hamburger" onClick={() => setOpen(!open)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </nav>
  );
}
