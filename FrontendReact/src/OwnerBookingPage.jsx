import React, { useState, useEffect,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './OwnerBookingPage.css';

const OwnerBookingPage = () => {
  const navigate = useNavigate();
  const deleteSlotRef = useRef();

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [formData, setFormData] = useState({
    carNumber: '',
    driverName: '',
    customerPhone: '',
    startTime: '',
    endTime: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const spotName = localStorage.getItem('spotName');
  const token = localStorage.getItem('ownerToken');

  useEffect(() => {
    if (!spotName || !token) {
      navigate('/owner/login');
      return;
    }

    fetchSlots();
  }, [spotName, token, navigate]);

  const fetchSlots = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/owner/slots/${spotName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSlots(data);
      } else {
        setError('Failed to load slots');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return setError('Please select a slot');

    const payload = {
      spotName,
      slotId: selectedSlot,
      ...formData
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/owner/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`Booked slot ${selectedSlot} successfully!`);
        setError('');
        setSelectedSlot('');
        setFormData({ carNumber: '', driverName: '', customerPhone: '', startTime: '', endTime: '' });
        fetchSlots();
        navigate('/owner/ticket-display');
      } else {
        setError(result.error || 'Booking failed');
      }
    } catch (err) {
      setError('Failed to book slot');
    }
  };

const handleDeleteSlot = async () => {
  // Prompt user to enter slot ID
  const slotIdToDelete = prompt('Enter the Slot ID to delete (e.g., T001):');
  
  if (!slotIdToDelete) {
    return setError('No slot ID entered');
  }

  if (!window.confirm(`Delete booking for slot ${slotIdToDelete}? This cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/owner/delete-slot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ spotName, slotId: slotIdToDelete })
    });

    if (response.ok) {
      setSuccess(`Slot ${slotIdToDelete} has been freed.`);
      fetchSlots(); // Refresh slot status
    } else {
      const data = await response.json();
      setError(data.error || 'Failed to delete slot');
    }
  } catch (err) {
    setError('Network error. Could not delete slot.');
  }
};

const handleDeleteSlotWithInput = async () => {
  const slotIdToDelete = deleteSlotRef.current?.value.trim();

  if (!slotIdToDelete) {
    return setError('Please enter a slot ID');
  }

  if (!window.confirm(`Delete booking for slot ${slotIdToDelete}?`)) return;

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/owner/delete-slot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ spotName, slotId: slotIdToDelete })
    });

    if (response.ok) {
      setSuccess(`Slot ${slotIdToDelete} has been freed.`);
      fetchSlots();
      deleteSlotRef.current.value = ''; // Clear input
    } else {
      const data = await response.json();
      setError(data.error || 'Failed to delete slot');
    }
  } catch (err) {
    setError('Network error');
  }
};

  const handleViewTickets = () => {
  navigate('/owner/see-slot');
};

  const handleLogout = () => {
    localStorage.removeItem('spotName');
    localStorage.removeItem('ownerToken');
    navigate('/owner/login');
  };

  if (!spotName || !token) {
    return <div>Redirecting to login...</div>;
  }



  return (
    <div className="booking-page">
      <div className="header">
        <h2>Manual Booking – {spotName.toUpperCase()}</h2>
        <div className="actions">
          <button onClick={handleViewTickets} className="btn-view">View Tickets</button>
          <button 
  onClick={handleDeleteSlot} 
  className="btn-delete"
>
  🗑️ Delete Slot
</button>

{/* Manual Delete Input */}
<div className="delete-slot-section">
  <input
    type="text"
    placeholder="Enter Slot ID to delete (e.g., T001)"
    ref={deleteSlotRef}  // Optional: use ref to get value
  />
  <button onClick={handleDeleteSlotWithInput} className="btn-delete-small">
    Delete
  </button>
</div>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <div className="grid">
        <div className="form-section">
          <h3>Enter Booking Details</h3>
          <form onSubmit={handleBook}>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              required
            >
              <option value="">Select Slot</option>
              {slots
                .filter(slot => slot.status === 'empty')
                .map(slot => (
                  <option key={slot.slotId} value={slot.slotId}>
                    {slot.slotId} ({slot.status})
                  </option>
                ))
              }
            </select>

            <input
              name="carNumber"
              placeholder="Car Number (e.g., KA01AB1234)"
              value={formData.carNumber}
              onChange={handleChange}
              required
            />
            <input
              name="driverName"
              placeholder="Driver Name"
              value={formData.driverName}
              onChange={handleChange}
              required
            />
            <input
              name="customerPhone"
              placeholder="Customer Phone"
              value={formData.customerPhone}
              onChange={handleChange}
              required
            />
            <input
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
            <input
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              required
            />

            {/* Auto-filled Date */}
            <div className="form-info">
              <label>Date:</label>
              <span>{new Date().toISOString().split('T')[0]}</span>
            </div>

            <button type="submit" className="btn-book">Book Slot</button>
          </form>
        </div>

        <div className="slots-preview">
          <h3>Available Slots</h3>
          <div className="slot-grid">
            {slots.map(slot => (
              <div
                key={slot.slotId}
                className={`slot ${slot.status === 'booked' ? 'booked' : 'empty'}`}
                onClick={() => {
                  if (slot.status === 'empty') setSelectedSlot(slot.slotId);
                }}
              >
                {slot.slotId} <br />
                <small>{slot.status}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerBookingPage;
