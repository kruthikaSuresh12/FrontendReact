// src/OwnerSeeSlot.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OwnerSeeSlot.css';

const OwnerSeeSlot = () => {
  const navigate = useNavigate();
  const [slotId, setSlotId] = useState('');
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');

  const spotName = localStorage.getItem('spotName');
  const token = localStorage.getItem('ownerToken');

  useEffect(() => {
    if (!spotName || !token) {
      navigate('/owner/login');
    }
  }, [spotName, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDetails(null);

    if (!slotId.trim()) {
      return setError('Please enter a slot ID');
    }

    try {
      const response = await fetch('http://localhost:5001/api/owner/see-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ spotName, slotId })
      });

      if (response.ok) {
        const data = await response.json();
        setDetails(data);
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to fetch slot details');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="see-slot-page">
      <h2>🔍 Check Slot Booking Status</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="slot-form">
        <input
          type="text"
          placeholder="Enter Slot ID (e.g., T001)"
          value={slotId}
          onChange={(e) => setSlotId(e.target.value)}
          required
        />
        <button type="submit">See Ticket</button>
      </form>

      {details && (
        <div className="slot-details">
          <h3>📌 Slot: {details.slot.slotId}</h3>
          <p><strong>Status:</strong> 
            <span className={details.slot.status === 'booked' ? 'booked' : 'empty'}>
              {details.slot.status}
            </span>
          </p>

          {details.ticket ? (
            <>
              <h4>🎟️ Ticket Details</h4>
              <p><strong>Car Number:</strong> {details.ticket.car_number}</p>
              <p><strong>Driver Name:</strong> {details.ticket.driving_person_name}</p>
              <p><strong>Customer Phone:</strong> {details.ticket.customer_phnNo}</p>
              <p><strong>Date:</strong> {details.ticket.date}</p>
              <p><strong>Start Time:</strong> {details.ticket.start_time}</p>
              <p><strong>End Time:</strong> {details.ticket.end_time}</p>
            </>
          ) : (
            <p><strong>This slot is empty — no ticket booked.</strong></p>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerSeeSlot;