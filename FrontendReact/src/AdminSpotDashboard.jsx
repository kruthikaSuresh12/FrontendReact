import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminSpotDashboard.css';

const AdminSpotDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <h1>Admin Panel</h1>
      <div className="button-group">
        <button onClick={() => navigate('/owner/login')}>
          🟢 Spot Owner Login
        </button>
        <button onClick={() => navigate('/owner/signup')}>
          🔵 Spot Owner Signup
        </button>
      </div>
      <button className="logout" onClick={() => {
        document.cookie = 'admin_token=; Max-Age=0; path=/';
        navigate('/admin/login');
      }}>
        Logout
      </button>
    </div>
  );
};

export default AdminSpotDashboard;