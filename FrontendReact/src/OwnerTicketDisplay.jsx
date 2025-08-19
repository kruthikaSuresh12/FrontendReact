import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OwnerTicketDisplay.css';

const OwnerTicketDisplay = () => {
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  const spotName = localStorage.getItem('spotName');
  const token = localStorage.getItem('ownerToken');

  useEffect(() => {
    if (!spotName || !token) {
      navigate('/owner/login');
      return;
    }

    const fetchLatestTicket = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/owner/tickets`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const tickets = await response.json();
          if (tickets.length > 0) {
            setTicket(tickets[0]); // Show latest ticket
          } else {
            setError('No tickets found.');
          }
        } else {
          const errData = await response.json();
          setError(errData.error || 'Failed to load ticket.');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      }
    };

    fetchLatestTicket();
  }, [spotName, token, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/owner/book');
  };

  return (
    <div className="ticket-display">
      <div className="ticket-container" id="printable-ticket">
        <h2>🎟️ Ticket</h2>
        {error && <p className="error">{error}</p>}
        
        {ticket ? (
          <div className="ticket-details">
            <p><strong>Spot Name:</strong> {ticket.spot_name}</p>
            <p><strong>Slot ID:</strong> {ticket.slotId}</p>
            <p><strong>Car Number:</strong> {ticket.car_number}</p>
            <p><strong>Driver Name:</strong> {ticket.driving_person_name || 'N/A'}</p>
            <p><strong>Customer Phone:</strong> {ticket.customer_phnNo || 'N/A'}</p>
            <p><strong>Date:</strong> {ticket.date}</p>
            <p><strong>Start Time:</strong> {ticket.start_time}</p>
            <p><strong>End Time:</strong> {ticket.end_time}</p>
          </div>
        ) : (
          !error && <p>Loading ticket...</p>
        )}
      </div>

      <div className="ticket-actions">
        <button onClick={handlePrint} className="btn-print">🖨️ Print</button>
        <button onClick={handleBack} className="btn-back">⬅️ Back</button>
      </div>
    </div>
  );
};

export default OwnerTicketDisplay;
