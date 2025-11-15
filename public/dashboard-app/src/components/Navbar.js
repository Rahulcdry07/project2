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
        <Link className="navbar-brand" to="/">
          <i className="bi bi-building me-2"></i>
          TenderHub
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
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/tenders">
                <i className="bi bi-search me-1"></i>
                Browse Tenders
              </Link>
            </li>
            {isAuth && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">
                    <i className="bi bi-house me-1"></i>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/recommendations">
                    <i className="bi bi-star me-1"></i>
                    For You
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">
                    <i className="bi bi-person me-1"></i>
                    Profile
                  </Link>
                </li>
              </>
            )}
            {isAdmin() && (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link" 
                  data-bs-toggle="dropdown"
                  style={{ border: 'none', background: 'none', color: 'rgba(255,255,255,.55)' }}
                >
                  <i className="bi bi-gear me-1"></i>
                  Admin
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/admin/tenders">
                      <i className="bi bi-folder me-2"></i>
                      Manage Tenders
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/admin/users">
                      <i className="bi bi-people me-2"></i>
                      Manage Users
                    </Link>
                  </li>
                </ul>
              </li>
            )}
          </ul>
          
          <div className="navbar-nav">
            {isAuth ? (
              <>
                <span className="navbar-text me-3">
                  Welcome, {user?.username}
                </span>
                <button 
                  className="btn btn-outline-light btn-sm" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;