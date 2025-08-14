import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import './index.css';

// Import all your components
import App from './App';
import Login from './login';
import SignupForm from './SignUp';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './reSetPassword';
import MapComponent from './MapComponent';
import ContactUs from './ContactUs';
import MarkSlotPage from './MarkSlotPage';
import BookSlot from './BookSlot';
import TicketBookingForm from './TicketBookingForm';
import ParkingPlaceForm from './ParkingPlaceForm';
import Ticket from './Ticket';
import Pay from './pay';
import YourTicket from './YourTicket';
import AdminLogin from './AdminLogin';
import AdminSpotLogin from './AdminSpotLogin';
import AdminSpotDashboard from './AdminSpotDashboard';
import OwnerLogin from './OwnerLogin';
import OwnerSignup from './OwnerSignup';
import OwnerBookingPage from './OwnerBookingPage';

// 🔽 NEW: Import newly created pages
import OwnerTicketDisplay from './OwnerTicketDisplay';  // ← Add this
import OwnerSeeSlot from './OwnerSeeSlot';              // ← Add this

// Admin & Other
import AdminDashboard from './AdminDashboard';
import DeleteSpot from './DeleteSpot';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/adminSpot-login" element={<AdminSpotLogin />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/Mapcomponent" element={<MapComponent />} />
            <Route path="/contactUs" element={<ContactUs />} />
            <Route path="/MarkSlotPage" element={<MarkSlotPage />} />
            <Route path="/book-slot" element={<BookSlot />} />
            <Route path="/TicketBookingForm" element={<TicketBookingForm />} />
            <Route path="/ParkingPlaceForm" element={<ParkingPlaceForm />} />
            <Route path="/ticket" element={<Ticket />} />
            <Route path="/pay" element={<Pay />} />
            <Route path="/your-tickets" element={<YourTicket />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/add-spot" element={<ParkingPlaceForm />} />
            <Route path="/delete-spot" element={<DeleteSpot />} />

            {/* Spot Owner Routes */}
            <Route path="/owner/login" element={<OwnerLogin />} />
            <Route path="/owner/signup" element={<OwnerSignup />} />
            <Route path="/owner/book" element={<OwnerBookingPage />} />
            <Route path="/owner/ticket-display" element={<OwnerTicketDisplay />} />
            <Route path="/owner/see-slot" element={<OwnerSeeSlot />} />
            <Route path="/owner/tickets" element={<OwnerSeeSlot />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);