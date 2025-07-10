// Ticket.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import "./Ticket.css"; // Optional styling

const Ticket = () => {
  const { state } = useLocation();

  if (!state || !state.formData) return <p>No ticket info found</p>;

  const { formData, spotName, slotId, totalAmount } = state;

  const {
    carNumber,
    license,
    startTime,
    endTime,
    driverName,
    customerPhone,
    date,
    ownerName,
    ownerPhone
  } = formData;

  return (
    <div className="ticket">
      <h2>🎫 Parking Ticket</h2>
      <p><strong>Spot Name:</strong> {spotName}</p>
      <p><strong>Slot ID:</strong> {slotId}</p>
      <p><strong>Date:</strong> {date}</p>
      <p><strong>Start Time:</strong> {startTime}</p>
      <p><strong>End Time:</strong> {endTime}</p>
      <p><strong>Car Number:</strong> {carNumber}</p>
      <p><strong>License:</strong> {license}</p>
      <p><strong>Driver:</strong> {driverName}</p>
      <p><strong>Customer Phone:</strong> {customerPhone}</p>
      <p><strong>Owner Name:</strong> {ownerName}</p>
      <p><strong>Owner Phone:</strong> {ownerPhone}</p>
      <p><strong>💰 Amount Paid:</strong> ₹{totalAmount}</p>
    </div>
  );
};

export default Ticket;
