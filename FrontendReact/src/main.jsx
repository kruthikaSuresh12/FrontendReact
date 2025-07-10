import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import SignupForm from './SignUp.jsx'
import SignupPage from './login.jsx'
import ForgotPassword from './ForgotPassword.jsx'
import ContactUs from './ContactUs';
import MapComponent from './MapComponent';
import MarkSlotPage from "./MarkSlotPage";
import BookSlot from "./BookSlot";
import TicketBookingForm from "./TicketBookingForm"
import ParkingPlaceForm from "./ParkingPlaceForm"
import Ticket from './Ticket';
import Pay from './pay';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<SignupPage />} />
        <Route path="/signup" element={< SignupForm/>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/Mapcomponent" element={<MapComponent />} />
        <Route path="/contactUs" element={<ContactUs />} /> 
        <Route path="/MarkSlotPage" element={<MarkSlotPage />} /> 
        <Route path="/book-slot" element={<BookSlot />} />
        <Route path="/TicketBookingForm" element={<TicketBookingForm />} />
        <Route path="/ParkingPlaceForm" element={<ParkingPlaceForm />} />
        <Route path="/ticket" element={<Ticket />} />
        <Route path="/pay" element={<Pay />} />
        

      </Routes>
    </BrowserRouter>
  </StrictMode>
)