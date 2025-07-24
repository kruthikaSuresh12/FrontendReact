server.js
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'kruthi@1234',
  database: process.env.DB_NAME || 'parking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id || user.userID,
      email: user.emailID
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Middleware setup
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// Token cleanup scheduler
setInterval(async () => {
  try {
    await db.query('DELETE FROM user_tokens WHERE expires_at < NOW()');
    console.log('Cleaned up expired tokens');
  } catch (err) {
    console.error('Token cleanup error:', err);
  }
}, 3600000); // Runs hourly

// Enhanced authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - No token provided' 
    });
  }

  try {
    // JWT verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Database token validation
    const [tokens] = await db.query(
      `SELECT * FROM user_tokens 
       WHERE token = ? 
       AND token_type = 'auth' 
       AND expires_at > NOW() 
       AND emailID = ?`,
      [token, decoded.email]
    );
    
    if (!tokens.length) {
      throw new Error('Invalid or expired token');
    }

    const [users] = await db.query(
      'SELECT * FROM login WHERE emailID = ?', 
      [decoded.email]
    );
    
    if (!users.length) {
      throw new Error('User not found');
    }

    req.user = users[0];
    next();
  } catch (err) {
    // Cleanup invalid token
    try {
      await db.query('DELETE FROM user_tokens WHERE token = ?', [token]);
    } catch (dbErr) {
      console.error('Token cleanup failed:', dbErr);
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized - Invalid session' 
    });
  }
};


// User Registration
app.post('/api/signup', async (req, res) => {
  try {
    const { name, age, emailID, mobNo, password, confirm_password, gender } = req.body;
    
    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        error: 'Password and confirmation do not match'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert user
      const [result] = await connection.query(
        `INSERT INTO login 
         (name, age, emailID, mobNo, password, gender) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [name, age, emailID, mobNo, hashedPassword, gender]
      );

      const newUser = {
        id: result.insertId,
        name,
        age,
        emailID,
        mobNo,
        gender
      };

      // Generate token
      const token = generateToken(newUser);
      const expiresAt = new Date(Date.now() + 3600000);

      await connection.query(
        `INSERT INTO user_tokens 
         (emailID, token_type, token, expires_at)
         VALUES (?, 'auth', ?, ?)`,
        [emailID, token, expiresAt]
      );

      await connection.commit();

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000,
        sameSite: 'lax',
        path: '/'
      });

      return res.status(201).json({
        success: true,
        user: newUser
      });

    } catch (err) {
      await connection.rollback();
      
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: 'Email address already registered'
        });
      }
      
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Account creation failed'
    });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { emailID, password } = req.body;
    
    const [users] = await db.query(
      'SELECT * FROM login WHERE emailID = ?', 
      [emailID]
    );
    
    if (!users.length) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user);
    const expiresAt = new Date(Date.now() + 3600000);

    await db.query(
      `INSERT INTO user_tokens 
       (emailID, token_type, token, expires_at)
       VALUES (?, 'auth', ?, ?)`,
      [emailID, token, expiresAt]
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
      sameSite: 'lax',
      path: '/'
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        emailID: user.emailID,
        age: user.age,
        mobNo: user.mobNo,
        gender: user.gender
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
});

// Password Reset Request
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { emailID } = req.body;
    
    const [users] = await db.query(
      'SELECT * FROM login WHERE emailID = ?', 
      [emailID]
    );
    
    if (!users.length) {
      // Don't reveal if user exists
      return res.json({ 
        success: true,
        message: 'If this email exists, a reset link was sent'
      });
    }

    // Generate and store reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    
    await db.query(
      `INSERT INTO user_tokens 
       (emailID, token_type, token, expires_at)
       VALUES (?, 'reset', ?, ?)`,
      [emailID, token, expiresAt]
    );

    // In production, send email here
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log('Password reset link:', resetLink);

    return res.json({
      success: true,
      message: 'Password reset initiated',
      token: process.env.NODE_ENV === 'development' ? token : undefined
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'Password reset failed'
    });
  }
});

// Password Reset Completion
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Validate reset token
    const [tokens] = await db.query(
      `SELECT * FROM user_tokens 
       WHERE token = ? 
       AND token_type = 'reset' 
       AND expires_at > NOW()`,
      [token]
    );
    
    if (!tokens.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    const emailID = tokens[0].emailID;
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update password
      await connection.query(
        'UPDATE login SET password = ? WHERE emailID = ?',
        [hashedPassword, emailID]
      );

      // Remove used token
      await connection.query(
        'DELETE FROM user_tokens WHERE token = ?',
        [token]
      );

      await connection.commit();
      
      return res.json({
        success: true,
        message: 'Password updated successfully'
      });

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      error: 'Password update failed'
    });
  }
});

// User Logout
app.post('/api/logout', authenticate, async (req, res) => {
  try {
    const token = req.cookies.token;
    
    // Remove token from database
    await db.query(
      'DELETE FROM user_tokens WHERE token = ?',
      [token]
    );

    // Clear cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// Protected User Profile
app.get('/api/user', authenticate, (req, res) => {
  return res.json({
    success: true,
    user: {
      name: req.user.name,
      emailID: req.user.emailID,
      age: req.user.age,
      mobNo: req.user.mobNo,
      gender: req.user.gender
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS configured for: ${corsOptions.origin}`);
});

MapServer.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import db from "./db.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/spots', (req, res) => {
  const sql = 'SELECT id, lat, lng, place, amount_per_hour FROM marked_spots';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

MapComponent.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './map.css';

import {
  GoogleMap,
  Marker,
  LoadScript,
  DirectionsRenderer,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "90vh",
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const MapComponent = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [spots, setSpots] = useState([]);
  const [nearbySpots, setNearbySpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [directions, setDirections] = useState(null);
  const [search, setSearch] = useState("");
  const [tracking, setTracking] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          alert("Location access denied. Using default coordinates.");
          setUserLocation({ lat: 0, lng: 0 });
        }
      );
    } else {
      setUserLocation({ lat: 0, lng: 0 });
    }
  }, []);

  useEffect(() => {
    fetch("http://localhost:5001/api/spots")
      .then((res) => res.json())
      .then((data) => setSpots(data));
  }, []);

  useEffect(() => {
    if (userLocation && spots.length > 0) {
      const nearby = spots.filter((spot) => {
        const dist = haversineDistance(
          userLocation.lat,
          userLocation.lng,
          spot.lat,
          spot.lng
        );
        return dist <= 1000000;
      });
      setNearbySpots(nearby);
    }
  }, [userLocation, spots]);

  useEffect(() => {
    let interval;
    if (tracking) {
      interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newLocation = { lat: latitude, lng: longitude };
            setUserLocation(newLocation);

            if (selectedSpot) {
              const directionsService =
                new window.google.maps.DirectionsService();
              directionsService.route(
                {
                  origin: newLocation,
                  destination: { lat: selectedSpot.lat, lng: selectedSpot.lng },
                  travelMode: window.google.maps.TravelMode.WALKING,
                },
                (result, status) => {
                  if (status === window.google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                  }
                }
              );
            }
          },
          () => {},
          { enableHighAccuracy: true }
        );
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [tracking, selectedSpot]);

  const handleClick = (spot) => {
    setSelectedSpot(spot);
    console.log("User Location:", userLocation);
    console.log("Destination:", spot.lat, spot.lng);

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: userLocation,
        destination: { lat: spot.lat, lng: spot.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        console.log("Directions status:", status, result);
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error("Directions failed:", status);
        }
      }
    );
  };

  const filteredSpots = nearbySpots.filter((spot) =>
  (spot.place || "").toLowerCase().includes(search.toLowerCase())
);


  return (
    <div
      style={{
        padding: "3rem",
        fontFamily: "sans-serif",
        backgroundColor: "#0e0808ff",
        color: "white",
        minHeight: "10vh",
        boxSizing: "border-box",
        marginRight: "25rem",
      }}
    >
      <div className="app-header">
  <h1 className="app-title">Google Map Nearby Spot</h1>
</div>

      <input
  type="text"
  placeholder="Search bar"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="search-input"
/>

      <h2 className="section-title">Spots Near You</h2>

      <div
        style={{
          height: "400px",
          marginBottom: "1.5rem",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid #444",
        }}
      >
        <div className="map-wrapper">
        <LoadScript googleMapsApiKey={import.meta.env.VITE_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ height: "100%", width: "100%" }}
            center={userLocation || { lat: 0, lng: 0 }}
            zoom={11}
          >
            {userLocation && (
              <Marker
                position={userLocation}
                icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                label="You"
              />
            )}
            {filteredSpots.map((spot) => (
              <Marker
                key={spot.id}
                position={{ lat: spot.lat, lng: spot.lng }}
                label={spot.place}
                onClick={() => handleClick(spot)}
              />
            ))}
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        </LoadScript>
      </div>
      </div>

      {selectedSpot && directions && (
        <div
          style={{
            backgroundColor: "#2c2c2c",
            padding: "1rem",
            borderRadius: "10px",
            marginTop: "1rem",
            border: "1px solid #444",
            color: "white",
          }}
        >
          <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>
            🚗 Drive to {selectedSpot.place}
          </div>
          <div>
            Distance: {directions.routes[0].legs[0].distance.text} <br />
            Duration: {directions.routes[0].legs[0].duration.text}
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <button
  onClick={() => setTracking(!tracking)}
  className={`action-button ${tracking ? 'tracking' : 'track-button'}`}
>
  {tracking ? "Stop" : "Start"}
</button>
          </div>
        </div>
      )}

      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          paddingRight: "0.5rem",
          marginTop: "1rem",
        }}
      >
        {filteredSpots.map((spot) => (
  <div
    key={spot.id}
    style={{
      background: "#2c2c2c",
      padding: "1rem",
      marginBottom: "0.75rem",
      borderRadius: "8px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      border: "1px solid #444",
    }}
  >
    <div>{spot.place}</div>
    <button
  onClick={() => {
    if (!userLocation) return alert("User location not available");

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: userLocation,
        destination: { lat: spot.lat, lng: spot.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          const leg = result.routes[0].legs[0];
          navigate("/book-slot", {
          state: {
          place: spot.place,
          address: leg.end_address,
          distance: leg.distance.text,
          duration: leg.duration.text,
          amountPerHour: spot.amount_per_hour   
          }
        });

        } else {
          alert("Failed to fetch directions");
        }
      }
    );
  }}
  style={{
    backgroundColor: "#0d6efd",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "white",
  }}
>
  Book Slot
</button>

  </div>
))}

      </div>
    </div>
  );
};

export default MapComponent;

authMiddleware.js
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? children : null;
};

export default ProtectedRoute;

SignUp.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import { log } from 'console';

function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    emailID: '',
    mobNo: '',
    password: '',
    confirm_password: '',
    gender: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  
  // Client-side validation
  if (formData.password !== formData.confirm_password) {
    setError("Passwords don't match!");
    return;
  }
  if (formData.age < 13) {
    setError("You must be at least 13 years old");
    return;
  }

  setIsLoading(true);
  
  try {
    const response = await fetch('http://localhost:5001/api/signup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Store user data and token
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect to map component
    navigate('/Mapcomponent');
    
  } catch (error) {
    console.error('Signup error:', error);
    setError(error.message || 'Failed to connect to server. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center p-4">
      {/* Form Container */}
      <div className="relative w-full max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute -top-12 left-0 flex items-center text-white hover:text-blue-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Home
        </button>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Create Your Account</h2>
              <p className="text-gray-400 mt-2">Join us today</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="John Doe"
                  required
                  autoComplete="name"
                />
              </div>

              {/* Age Field */}
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-300 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="25"
                  min="13"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="emailID" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="emailID"
                  name="emailID"
                  value={formData.emailID}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              {/* Mobile Number Field */}
              <div>
                <label htmlFor="mobNo" className="block text-sm font-medium text-gray-300 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobNo"
                  name="mobNo"
                  value={formData.mobNo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="+1 234 567 890"
                  required
                  autoComplete="tel"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Gender Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gender
                </label>
                <div className="flex space-x-4 justify-start">
                  {['Male', 'Female', 'Other'].map(gender => (
                    <label key={gender} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="gender"
                        value={gender}
                        checked={formData.gender === gender}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700"
                        required
                      />
                      <span className="text-gray-300">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 mt-6 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Signing Up...' : 'Sign Up Now'}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center text-sm text-gray-400">
              Already have an account?{' '}
              <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupForm;

Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Login() {
  const [formData, setFormData] = useState({
    emailID: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  try {
    const response = await fetch('http://localhost:5001/api/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    localStorage.setItem('user', JSON.stringify(data.user));
    navigate('/Mapcomponent');
    
  } catch (error) {
    console.error('Login error:', error);
    setError(error.message || 'Failed to connect to server. Please try again.');
  }
};

  return (
    <div className="min-h-screen flex items-center p-4">
      {/* Form Container */}
      <div className="w-full max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center text-white hover:text-blue-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Home
        </button>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-gray-400 mt-2">Sign in to your account</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="emailID" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="emailID"
                  name="emailID"
                  value={formData.emailID}
                  onChange={handleChange}
                  autoComplete="username"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>
                <a href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Sign In
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign up
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

mainModule.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import SignupForm from './SignUp.jsx'
import Login from './login.jsx'
import ForgotPassword from './ForgotPassword.jsx'
import ContactUs from './ContactUs';
import MapComponent from './MapComponent';
import MarkSlotPage from "./MarkSlotPage";
import BookSlot from "./BookSlot";
import TicketBookingForm from "./TicketBookingForm"
import ParkingPlaceForm from "./ParkingPlaceForm"
import Ticket from './Ticket';
import Pay from './pay';
import ResetPassword from './reSetPassword.jsx';
import { AuthProvider, useAuth } from './AuthContext';
import { AuthContext } from '../../FrontendReact/src/AuthContext.jsx';

// Create wrapper components for protected and public routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/Mapcomponent" replace />;
  }

  return children;
};

// Main App component
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<App />} />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute>
            <SignupForm />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/Mapcomponent" element={
          <ProtectedRoute>
            <MapComponent />
          </ProtectedRoute>
        } />
        <Route path="/contactUs" element={
          <ProtectedRoute>
            <ContactUs />
          </ProtectedRoute>
        } /> 
        <Route path="/MarkSlotPage" element={
          <ProtectedRoute>
            <MarkSlotPage />
          </ProtectedRoute>
        } /> 
        <Route path="/book-slot" element={
          <ProtectedRoute>
            <BookSlot />
          </ProtectedRoute>
        } />
        <Route path="/TicketBookingForm" element={
          <ProtectedRoute>
            <TicketBookingForm />
          </ProtectedRoute>
        } />
        <Route path="/ParkingPlaceForm" element={
          <ProtectedRoute>
            <ParkingPlaceForm />
          </ProtectedRoute>
        } />
        <Route path="/ticket" element={
          <ProtectedRoute>
            <Ticket />
          </ProtectedRoute>
        } />
        <Route path="/pay" element={
          <ProtectedRoute>
            <Pay />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};

// Render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>
);

AuthContext.jsximport { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/user', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Authentication check failed');
      }
      
      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    await checkAuth(); // Verify auth status
  };

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      checkAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

ProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

auth.jsx
// import express from 'express';
// import db from './db.js';
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';

// const router = express.Router();
// const JWT_SECRET = "JWT_SECRET";

// // USER SIGNUP (Always hash new passwords)
// router.post('/signup', async (req, res) => {
//   const { name, age, emailID, mobNo, password, confirm_password, gender } = req.body;

//   if (!emailID || !password) {
//     return res.status(400).json({ error: "Email and password are required" });
//   }

//   try {
//     // Check if user exists
//     const [existingUsers] = await db.promise().query(
//       "SELECT * FROM login WHERE emailID = ?", 
//       [emailID]
//     );
    
//     if (existingUsers.length > 0) {
//       return res.status(409).json({ error: "User already exists" });
//     }

//     // Hash new password
//     const hashedPassword = await bcrypt.hash(password, 10);
    
//     // Insert new user with hashed password
//     await db.promise().query(
//       `INSERT INTO login 
//        (name, age, emailID, mobNo, password, confirm_password, gender) 
//        VALUES (?, ?, ?, ?, ?, ?, ?)`, 
//       [name, age, emailID, mobNo, hashedPassword, confirm_password, gender]
//     );
    
//     res.status(201).json({ message: "User created successfully" });
//   } catch (error) {
//     console.error("Signup Error:", error);
//     res.status(500).json({ error: "User creation failed" });
//   }
// });

// // USER LOGIN (Assume all passwords are hashed)
// router.post('/login', async (req, res) => {
//   const { emailID, password } = req.body;
  
//   if (!emailID || !password) {
//     return res.status(400).json({ error: "Email and password are required" });
//   }

//   try {
//     // Find user
//     const [users] = await db.promise().query(
//       "SELECT * FROM login WHERE emailID = ?", 
//       [emailID]
//     );
    
//     if (users.length === 0) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     const user = users[0];
    
//     // Compare with bcrypt (will fail for old plaintext passwords)
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { emailID: user.emailID, name: user.name },
//       JWT_SECRET,
//       { expiresIn: '2h' }
//     );

//     res.json({ 
//       token,
//       user: {
//         name: user.name,
//         emailID: user.emailID
//       }
//     });
//   } catch (error) {
//     console.error("Login Error:", error);
//     res.status(500).json({ error: "Login failed" });
//   }
// });

// export default router; 