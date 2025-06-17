import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import SignupForm from './login.jsx'
import SignupPage from './signupPage.jsx'
import ForgotPassword from './ForgotPassword.jsx'
import ContactUs from './ContactUs';
import MapComponent from './MapComponent';
import MarkSlotPage from "./MarkSlotPage";
import BookSlot from "./BookSlot";
import TicketBookingForm from "./TicketBookingForm"
import ParkingPlaceForm from "./ParkingPlaceForm"


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<SignupForm />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/Mapcomponent" element={<MapComponent />} />
        <Route path="/contactUs" element={<ContactUs />} /> 
        <Route path="/MarkSlotPage" element={<MarkSlotPage />} /> 
        <Route path="/book-slot" element={<BookSlot />} />
        <Route path="/TicketBookingForm" element={<TicketBookingForm />} />
        <Route path="/ParkingPlaceForm" element={<ParkingPlaceForm />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)