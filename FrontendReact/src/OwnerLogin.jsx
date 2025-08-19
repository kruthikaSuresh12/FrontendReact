import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

const OwnerLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    spotName: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/owner/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const data = await response.json();
      const cleanSpotName = formData.spotName.toLowerCase().replace(/\s+/g, '_');
      localStorage.setItem('spotName', cleanSpotName);
      localStorage.setItem('ownerToken', data.token);
      navigate('/owner/book');
    } else {
      const errData = await response.json();
      setError(errData.error || 'Invalid credentials');
    }
  } catch (err) {
    setError('Failed to connect');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="admin-login">
      <div className="card">
        <h2>Spot Owner Login</h2>
        {error && <p className="error">{error}</p>}
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
          <button type="submit">Login</button>
        </form>
        <p>
          New owner? <a href="/owner/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default OwnerLogin;
