import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './YourTicket.css';

const YourTicket = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user-tickets`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch tickets');

        const data = await response.json();
        setTickets(data);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('No token found')) navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user, navigate, logout]);

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    return new Date(dateTimeStr).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return (
      <div className="your-ticket-container">
        <div className="your-ticket-wrapper">
          <div className="loading-container">
            <div>
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading your tickets...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="your-ticket-container">
        <div className="your-ticket-wrapper">
          <div className="error-container">
            <div className="error-card">
              <h1 className="error-title">Oops! Something went wrong</h1>
              <p className="error-message">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="error-button"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="your-ticket-container">
      <div className="your-ticket-wrapper">
        {/* Header */}
        <div className="ticket-header">
          <button
            onClick={() => navigate('/Mapcomponent')}
            className="back-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Map</span>
          </button>
          <button onClick={logout} className="logout-button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {/* Title */}
        <h1 className="page-title">Your Parking Tickets</h1>
        <p className="page-subtitle">Manage and view your current and upcoming bookings</p>

        {/* No Tickets */}
        {tickets.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="empty-title">No Tickets Yet</h2>
            <p className="empty-text ">Looks like you haven’t booked any parking spots.</p>
            <button
              onClick={() => navigate('/Mapcomponent')}
              className="book-button"
            >
              Book a Parking Spot
            </button>
          </div>
        ) : (
          /* Tickets List */
          <div>
            {tickets.map((ticket) => (
              <div
                key={`${ticket.car_number}-${ticket.date}-${ticket.start_time}`}
                className="ticket-card"
              >
                <div className="ticket-header">
                  <div>
                    <h2 className="spot-name">{ticket.spot_name}</h2>
                    <p className="car-number">{ticket.car_number}</p>
                  </div>
                  <div>
                    <p className="ticket-date">
                      {new Date(ticket.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="ticket-info-grid">
                  <div>
                    <p className="label">Driver</p>
                    <p className="value">{ticket.driving_person_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="label">Time Slot</p>
                    <p className="value">
                      {formatDateTime(ticket.start_time)} — {formatDateTime(ticket.end_time)}
                    </p>
                  </div>
                  <div>
                    <p className="label">Owner</p>
                    <p className="value">{ticket.car_owner_name || 'Not specified'}</p>
                  </div>
                </div>

                <div className="ticket-footer">
                  <div>
                    <p className="contact-label">Contact</p>
                    <p className="contact-value">{ticket.customer_phnNo || ticket.owner_phnNo || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => navigate('/Mapcomponent')}
                    className="view-map-button"
                  >
                    View on Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourTicket;
