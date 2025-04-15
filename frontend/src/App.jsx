import { useState } from 'react';
import './App.css';
import logo from './hospitallogo.png';
import backgroundVideo from './backgroundvideo.mp4';
import { FiUpload, FiSearch, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function App() {
  const [activeNav, setActiveNav] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const leftNavItems = [
    { id: 'doctors', label: 'DOCTORS' },
    { id: 'patients', label: 'PATIENTS' }
  ];

  const rightNavItems = [
    { id: 'receptionists', label: 'RECEPTIONISTS' },
    { id: 'technicians', label: 'LAB TECHNICIANS' }
  ];

  const handleNavClick = (id) => {
    if (id === 'doctors') {
      navigate('/select-role');
    }
    // you can add more logic for 'patients' or others if needed
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search/${searchQuery.trim()}`);
    }
  };

  return (
    <div className="app-container">
      <video autoPlay loop muted className="video-background">
        <source src={backgroundVideo} type="video/mp4" />
      </video>

      <nav className="main-nav">
        <div className="nav-content">
          {leftNavItems.map(item => (
            <div 
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onMouseEnter={() => setActiveNav(item.id)}
              onMouseLeave={() => setActiveNav(null)}
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </div>
          ))}

          <img src={logo} alt="Hospital Logo" className="nav-logo" />

          {rightNavItems.map(item => (
            <div 
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onMouseEnter={() => setActiveNav(item.id)}
              onMouseLeave={() => setActiveNav(null)}
            >
              {item.label}
            </div>
          ))}
        </div>
      </nav>

      <div className="content-overlay">
        <div className="search-container">
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search For Medicine Details / Upload The prescription.." 
              className="search-bar" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
            <button className="action-btn">
              <FiUpload className="action-icon" />
            </button>
            <button className="action-btn">
              <FiUser className="action-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
