import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DeleteSpot.css';

const DeleteSpot = () => {
  const [spotName, setSpotName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [spots, setSpots] = useState([]);
  const [filteredSpots, setFilteredSpots] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch spots on mount
  useEffect(() => {
    const fetchSpots = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/spots`, {
      method: 'GET',
      credentials: 'include', // ← Must be included
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Response status:', response.status);

    if (response.status === 401) {
      alert('Session expired or not logged in. Please log in again.');
      return navigate('/admin-login');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch spots');
    }

    const data = await response.json();
    const spotNames = data.map(s => s.place);
    setSpots(spotNames);
    setFilteredSpots(spotNames);
  } catch (err) {
    console.error('Fetch error:', err);
    setError('Failed to load spots');
  } finally {
    setLoading(false);
  }
};

    fetchSpots();
  }, [navigate]);

  // Filter spots when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSpots(spots);
    } else {
      setFilteredSpots(
        spots.filter(spot =>
          spot.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, spots]);

  const handleDelete = async () => {
    if (!spotName) {
      return setError('Please select a spot');
    }

    if (!window.confirm(`Are you sure you want to delete "${spotName}"?`)) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/delete-spot`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ spotName })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setSpots(prev => prev.filter(s => s !== spotName));
        setFilteredSpots(prev => prev.filter(s => s !== spotName));
        setSpotName('');
        setSearchTerm('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete spot');
    }
  };

  const handleSelect = (spot) => {
    setSpotName(spot);
    setSearchTerm(spot);
    setShowSuggestions(false);
  };

  const clearSelection = () => {
    setSpotName('');
    setSearchTerm('');
    setShowSuggestions(false);
  };

  if (loading) return <div className="loading">Loading spots...</div>;

  return (
    <div className="delete-spot">
      <h2>Delete Parking Spot</h2>
      {error && <p className="error">{error}</p>}

      <div className="search-container">
        <label htmlFor="spot-search">Search or Select Spot</label>
        <div className="search-box">
          <input
            type="text"
            id="spot-search"
            placeholder="Type to search spot..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSpotName(''); // Clear selection when typing
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Delay to allow click
          />
          {searchTerm && (
            <button
              className="clear-btn"
              onClick={clearSelection}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSpots.length > 0 && (
          <ul className="suggestions-list">
            {filteredSpots.map(spot => (
              <li
                key={spot}
                onClick={() => handleSelect(spot)}
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                className="suggestion-item"
              >
                {spot}
              </li>
            ))}
          </ul>
        )}
        {showSuggestions && filteredSpots.length === 0 && searchTerm && (
          <p className="no-results">No matching spots found</p>
        )}
      </div>

      {/* Hidden select (for form logic, optional) */}
      {/* You can remove this if you're not using it */}
      {/* <select
        value={spotName}
        onChange={(e) => handleSelect(e.target.value)}
        style={{ display: 'none' }}
      >
        <option value="">Select a spot</option>
        {spots.map(spot => (
          <option key={spot} value={spot}>{spot}</option>
        ))}
      </select> */}

      <div className="buttons">
        <button
          onClick={handleDelete}
          disabled={!spotName}
          className="delete-btn"
        >
          Delete Spot
        </button>
        <button onClick={() => navigate(-1)} className="cancel">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DeleteSpot;
