import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, clearAuthData, isAdmin } from '../utils/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAuth = isAuthenticated();

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-shield-check me-2"></i>
          SecureApp Pro
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          {isAuth ? (
            <>
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/files">
                    <i className="bi bi-folder2-open me-1"></i>
                    Files
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">
                    <i className="bi bi-person me-1"></i>
                    Profile
                  </Link>
                </li>
                <li className="nav-item dropdown">
                  <button 
                    className="nav-link dropdown-toggle btn btn-link" 
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-tools me-1"></i>
                    Tools
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <a 
                        className="dropdown-item" 
                        href="/api/metrics" 
                        target="_blank"
                      >
                        <i className="bi bi-graph-up me-1"></i>
                        System Metrics
                      </a>
                    </li>
                    <li>
                      <a 
                        className="dropdown-item" 
                        href="/api-docs" 
                        target="_blank"
                      >
                        <i className="bi bi-book me-1"></i>
                        API Documentation
                      </a>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <a 
                        className="dropdown-item" 
                        href="/api/health" 
                        target="_blank"
                      >
                        <i className="bi bi-activity me-1"></i>
                        Health Check
                      </a>
                    </li>
                  </ul>
                </li>
                {isAdmin() && (
                  <li className="nav-item">
                    <Link className="nav-link text-warning" to="/admin">
                      <i className="bi bi-shield-lock me-1"></i>
                      Admin
                    </Link>
                  </li>
                )}
              </ul>
              <div className="navbar-nav">
                <div className="nav-item dropdown">
                  <button 
                    className="nav-link dropdown-toggle btn btn-link" 
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-person-circle me-1"></i>
                    {user?.username}
                    {isAdmin() && <span className="badge bg-warning text-dark ms-1">Admin</span>}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="bi bi-person-gear me-1"></i>
                        Profile Settings
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/files">
                        <i className="bi bi-files me-1"></i>
                        My Files
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={(e) => {
                          e.preventDefault();
                          handleLogout();
                        }}
                      >
                        <i className="bi bi-box-arrow-right me-1"></i>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/register">
                  Register
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;