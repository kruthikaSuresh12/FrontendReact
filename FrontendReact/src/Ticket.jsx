// Ticket.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import "./Ticket.css"; // Optional CSS for styling

const Ticket = () => {
  const { state } = useLocation();
  if (!state) return <p>No ticket info found</p>;

  return (
    <div className="ticket">
      <h2>🎫 Parking Ticket</h2>
      <p><strong>Spot Name:</strong> {state.spotName}</p>
      <p><strong>Slot ID:</strong> {state.slotId}</p>
      <p><strong>Date:</strong> {state.date}</p>
      <p><strong>Start Time:</strong> {state.startTime}</p>
      <p><strong>End Time:</strong> {state.endTime}</p>
      <p><strong>Car Number:</strong> {state.carNumber}</p>
      <p><strong>License:</strong> {state.license}</p>
      <p><strong>Driver:</strong> {state.driverName}</p>
      <p><strong>Customer Phone:</strong> {state.customerPhone}</p>
      <p><strong>Owner Name:</strong> {state.ownerName}</p>
      <p><strong>Owner Phone:</strong> {state.ownerPhone}</p>
    </div>
  );
};

export default Ticket;
