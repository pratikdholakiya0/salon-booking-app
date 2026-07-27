import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Calendar, Scissors, Users, Settings, LogOut, Menu, X, Scissors as ScissorsIcon
} from 'lucide-react';
import { useState } from 'react';
import './SalonLayout.css';

const NAV = [
  { to: '/salon/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/salon/bookings',  icon: <Calendar size={18} />,        label: 'Bookings'  },
  { to: '/salon/services',  icon: <Scissors size={18} />,        label: 'Services'  },
  { to: '/salon/staff',     icon: <Users size={18} />,           label: 'Staff'     },
  { to: '/salon/profile',   icon: <Settings size={18} />,        label: 'Settings'  },
];

export default function SalonLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className={`salon-shell ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`salon-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sb-header">
          <div className="sb-logo">
            <ScissorsIcon size={18} className="sb-logo-icon" />
            {!collapsed && <span>Book<span className="gold">MyBeauty</span></span>}
          </div>
          <button className="sb-collapse-btn" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
            <Menu size={16} />
          </button>
        </div>

        {/* Salon info */}
        <div className="sb-salon-info">
          <div className="sb-salon-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
          {!collapsed && (
            <div className="sb-salon-text">
              <p className="sb-salon-name">{user?.name}</p>
              <p className="sb-salon-role">Salon Owner</p>
            </div>
          )}
        </div>

        <div className="sb-divider" />

        {/* Nav items */}
        <nav className="sb-nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `sb-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}>
              <span className="sb-nav-icon">{item.icon}</span>
              {!collapsed && <span className="sb-nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="sb-footer">
          <div className="sb-divider" />
          <button className="sb-logout" onClick={handleLogout}>
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sb-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="salon-main">
        {/* Top bar */}
        <header className="salon-topbar">
          <button className="sb-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="topbar-right">
            <div className="topbar-user">
              <div className="topbar-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
              <span className="topbar-name">{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        <main className="salon-content">
          {children}
        </main>
      </div>
    </div>
  );
}
