import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="options">
        <button onClick={() => navigate('/add-spot')}>
          Add New Spot
        </button>
        <button onClick={() => navigate('/delete-spot')}>
          Delete Spot
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;