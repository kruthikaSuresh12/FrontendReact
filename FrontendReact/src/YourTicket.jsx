//YourTicket.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './App.css';

const YourTicket = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();


 useEffect(() => {
  const fetchTickets = async () => {
    // If no user, don't fetch
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('http://localhost:5001/api/user-tickets', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        logout(); // ✅ Let logout handle cleanup
        navigate('/login', { replace: true });
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data);
    } catch (err) {
      console.error('Ticket fetch error:', err);
      setError(err.message);

      // If token issue, redirect
      if (err.message.includes('No token found') || response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  fetchTickets();
}, [user, navigate, logout]); // Only run when user or auth changes

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen  text-white p-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl text-red-500 mb-4">Error loading tickets</h1>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate('/Mapcomponent')}
          className="mb-4 flex items-center text-blue-400 hover:text-blue-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Parking Tickets</h1>
          <div className="flex items-center space-x-4">
            <div className="text-blue-400">
            </div>
            <button 
              onClick={logout}
              className="text-red-400 hover:text-red-300"
            >
              Logout
            </button>
          </div>
        </div>
        
        {tickets.length === 0 ? (
          <div className="bg-gray-800 p-6 rounded-lg text-center">
            <p className="text-xl">You don't have any tickets yet.</p>
            <button 
              onClick={() => navigate('/Mapcomponent')}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              Book a Parking Spot
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={`${ticket.car_number}-${ticket.date}-${ticket.start_time}`} 
                   className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-blue-400">{ticket.spot_name}</h2>
                    <p className="text-gray-400">{ticket.car_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {new Date(ticket.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-gray-400">Driver</p>
                    <p>{ticket.driving_person_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Time Slot</p>
                    <p>
                      {formatDateTime(ticket.start_time)} - {formatDateTime(ticket.end_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Owner</p>
                    <p>{ticket.car_owner_name || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                  <div>
                    <p className="text-gray-400">Contact</p>
                    <p>{ticket.customer_phnNo || ticket.owner_phnNo || 'N/A'}</p>
                  </div>
                  <button 
                    onClick={() => navigate('/Mapcomponent')}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg text-sm"
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