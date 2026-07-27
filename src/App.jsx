import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import SalonLayout from './components/SalonLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Contact from './pages/Contact';
import SalonList from './pages/SalonList';
import SalonDetail from './pages/SalonDetail';
import CustomerBookings from './pages/CustomerBookings';
import CustomerProfile from './pages/CustomerProfile';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SalonDashboard from './pages/salon/SalonDashboard';
import SalonBookings from './pages/salon/SalonBookings';
import SalonServices from './pages/salon/SalonServices';
import SalonStaff from './pages/salon/SalonStaff';
import SalonProfile from './pages/salon/SalonProfile';
import Map from './pages/Map';

function SalonPage({ children }) {
  return (
    <ProtectedRoute role="SALON_OWNER">
      <SalonLayout>{children}</SalonLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/salons" element={<SalonList />} />
            <Route path="/salons/:id" element={<SalonDetail />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Customer */}
            <Route path="/customer/bookings" element={<ProtectedRoute role="CUSTOMER"><CustomerBookings /></ProtectedRoute>} />
            <Route path="/customer/profile"  element={<ProtectedRoute role="CUSTOMER"><CustomerProfile /></ProtectedRoute>} />
            <Route path="/customer/map"  element={<ProtectedRoute role="CUSTOMER"><Map /></ProtectedRoute>} />

            {/* Smart profile route — works for all roles */}
            <Route path="/profile" element={<Profile />} />

            {/* Salon admin — all wrapped in sidebar layout */}
            <Route path="/salon/dashboard" element={<SalonPage><SalonDashboard /></SalonPage>} />
            <Route path="/salon/bookings"  element={<SalonPage><SalonBookings /></SalonPage>} />
            <Route path="/salon/services"  element={<SalonPage><SalonServices /></SalonPage>} />
            <Route path="/salon/staff"     element={<SalonPage><SalonStaff /></SalonPage>} />
            <Route path="/salon/profile"   element={<SalonPage><SalonProfile /></SalonPage>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
