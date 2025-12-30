import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, clearAuthData, isAdmin } from '../utils/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAuth = isAuthenticated();
  const userInitial = (user?.username || user?.email || '?').charAt(0).toUpperCase();

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark app-navbar sticky-top">
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
          <ul className="navbar-nav me-auto align-items-lg-center">
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/tenders">
                <i className="bi bi-search me-1"></i>
                Browse Tenders
              </NavLink>
            </li>
            {isAuth && (
              <>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/dashboard">
                    <i className="bi bi-house me-1"></i>
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/recommendations">
                    <i className="bi bi-star me-1"></i>
                    For You
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/profile">
                    <i className="bi bi-person me-1"></i>
                    Profile
                  </NavLink>
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
          
          <div className="navbar-nav align-items-lg-center gap-2">
            {isAuth ? (
              <>
                <div className="nav-user-chip">
                  <span className="nav-user-avatar" aria-hidden="true">{userInitial}</span>
                  <div className="d-flex flex-column">
                    <span className="fw-semibold text-white-50">{user?.role || 'User'}</span>
                    <span className="fw-semibold text-white">{user?.username}</span>
                  </div>
                </div>
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