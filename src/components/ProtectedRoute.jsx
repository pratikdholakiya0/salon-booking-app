import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  // If role constraint given, check against DB-fetched user.role
  if (role && user?.role !== role) {
    // Salon owner trying to hit customer route → send to their dashboard
    if (user?.role === 'SALON_OWNER') return <Navigate to="/salon/dashboard" replace />;
    // Customer trying to hit salon route → send home
    return <Navigate to="/" replace />;
  }

  return children;
}
