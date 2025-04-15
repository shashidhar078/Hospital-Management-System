// src/pages/RoleSelection.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const [role, setRole] = useState('admin'); // Default to admin
  const navigate = useNavigate();

  const handleRoleChange = (e) => {
    setRole(e.target.value);
  };

  const handleSubmit = () => {
    if (role === 'admin') {
      navigate('/admin/login'); // Route to Admin Login
    } else {
      navigate('/doctor/login'); // Route to Doctor Login
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Select Your Role</h1>
      <div className="flex flex-col items-start mb-4">
        <label className="flex items-center">
          <input
            type="radio"
            value="admin"
            checked={role === 'admin'}
            onChange={handleRoleChange}
            className="mr-2"
          />
          Admin
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            value="doctor"
            checked={role === 'doctor'}
            onChange={handleRoleChange}
            className="mr-2"
          />
          Doctor
        </label>
      </div>
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Continue
      </button>
    </div>
  );
};

export default RoleSelection;