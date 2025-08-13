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

import AdminDashboard from './AdminDashboard';   // Adjust path if needed
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