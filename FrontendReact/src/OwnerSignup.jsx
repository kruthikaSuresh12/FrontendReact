import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OwnerSignup.css';

const OwnerSignup = () => {
  const [formData, setFormData] = useState({
    username: '',
    spotName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  if (formData.password !== formData.confirmPassword) {
    return setError('Passwords do not match');
  }

  try {
    const response = await fetch('http://localhost:5001/api/owner/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.username,
        spotName: formData.spotName.toLowerCase(), // ✅ Fixed
        password: formData.password,
        confirmPassword: formData.confirmPassword
      })
    });

    const data = await response.json();

    if (response.ok) {
      setSuccess('Signup successful! Please login.');
      setTimeout(() => navigate('/owner/login'), 1500);
    } else {
      setError(data.error);
    }
  } catch (err) {
    console.error('Signup error:', err); // 🔍 Debug
    setError('Server error. Try again.');
  }
};

  return (
    <div className="owner-signup">
      <div className="card">
        <h2>Spot Owner Signup</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="spotName"
            placeholder="Spot Name (e.g., jssateb)"
            value={formData.spotName}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <button type="submit">Register</button>
        </form>
        <p>
          Already have an account? <a href="/owner/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default OwnerSignup;