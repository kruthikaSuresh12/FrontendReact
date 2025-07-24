import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import SignupForm from './SignUp.jsx'
import Login from './login.jsx'
import ForgotPassword from './ForgotPassword.jsx'
import ContactUs from './ContactUs';
import MapComponent from './MapComponent';
import MarkSlotPage from "./MarkSlotPage";
import BookSlot from "./BookSlot";
import TicketBookingForm from "./TicketBookingForm"
import ParkingPlaceForm from "./ParkingPlaceForm"
import Ticket from './Ticket';
import Pay from './pay';
import ResetPassword from './reSetPassword.jsx';
import { AuthProvider, useAuth } from './AuthContext';

// Create wrapper components for protected and public routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/Mapcomponent" replace />;
  }

  return children;
};

// Main App component
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<App />} />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignupForm />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/Mapcomponent" element={
          <ProtectedRoute>
            <MapComponent />
          </ProtectedRoute>
        } />
        <Route path="/contactUs" element={
          <ProtectedRoute>
            <ContactUs />
          </ProtectedRoute>
        } /> 
        <Route path="/MarkSlotPage" element={
          <ProtectedRoute>
            <MarkSlotPage />
          </ProtectedRoute>
        } /> 
        <Route path="/book-slot" element={
          <ProtectedRoute>
            <BookSlot />
          </ProtectedRoute>
        } />
        <Route path="/TicketBookingForm" element={
          <ProtectedRoute>
            <TicketBookingForm />
          </ProtectedRoute>
        } />
        <Route path="/ParkingPlaceForm" element={
          <ProtectedRoute>
            <ParkingPlaceForm />
          </ProtectedRoute>
        } />
        <Route path="/ticket" element={
          <ProtectedRoute>
            <Ticket />
          </ProtectedRoute>
        } />
        <Route path="/pay" element={
          <ProtectedRoute>
            <Pay />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};

// Render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>
);