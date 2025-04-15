// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App'; // your landing/main page
import RoleSelection from './pages/RoleSelection';
import AuthPage from './pages/AuthPage'; // Import the new AuthPage component
import AdminLogin from './pages/auth/AdminLogin';
import DoctorLogin from './pages/auth/DoctorLogin';
import DoctorRegister from './pages/auth/DoctorRegister';
import "./index.css";
import GenAiSearch from './genai/GenAiSearch';



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/select-role" element={<RoleSelection />} />
        <Route path="/auth" element={<AuthPage />} /> {/* Add this line */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor/register" element={<DoctorRegister />} />
        <Route path="/search/:query" element={<GenAiSearch />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);