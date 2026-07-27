import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CustomerProfile from './CustomerProfile';

/**
 * Smart /profile route.
 * Reads role from DB-fetched user object (set during login via /api/user).
 * SALON_OWNER → redirects to their sidebar dashboard.
 * CUSTOMER    → shows CustomerProfile.
 * Not logged in → redirects to /login.
 */
export default function Profile() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login', { replace: true }); return; }
    if (user?.role === 'SALON_OWNER') { navigate('/salon/dashboard', { replace: true }); }
  }, [isLoggedIn, user, navigate]);

  if (!isLoggedIn) return null;
  if (user?.role === 'SALON_OWNER') return null;

  return <CustomerProfile />;
}
