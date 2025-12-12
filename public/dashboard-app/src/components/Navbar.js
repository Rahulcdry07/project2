import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, clearAuthData, isAdmin } from '../utils/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAuth = isAuthenticated();

  const handleLogout = () => {
    clearAuthData();
    closeOffcanvas();
    navigate('/login');
  };

  const closeOffcanvas = () => {
    const offcanvas = document.getElementById('offcanvasNavbar');
    const backdrop = document.querySelector('.offcanvas-backdrop');
    
    if (offcanvas) {
      offcanvas.classList.remove('show');
      if (backdrop) {
        backdrop.remove();
      }
      document.body.classList.remove('offcanvas-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  };

  const handleNavClick = (path) => {
    closeOffcanvas();
    setTimeout(() => navigate(path), 300);
  };

  return (
    <>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <i className="bi bi-briefcase me-2"></i>
            Tender Management System
          </Link>
          
          {isAuth ? (
            <>
              {/* Desktop Navigation */}
              <div className="d-none d-lg-flex align-items-center flex-grow-1">
                <ul className="navbar-nav me-auto ms-4 flex-row gap-3">
                  <li className="nav-item">
                    <Link className="nav-link" to="/tenders">
                      <i className="bi bi-file-earmark-text me-1"></i>
                      Browse Tenders
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/recommendations">
                      <i className="bi bi-stars me-1"></i>
                      Recommendations
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/upload">
                      <i className="bi bi-cloud-upload me-1"></i>
                      Upload
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/notes">
                      <i className="bi bi-journal-text me-1"></i>
                      Notes
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/activity">
                      <i className="bi bi-clock-history me-1"></i>
                      Activity
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/notifications">
                      <i className="bi bi-bell me-1"></i>
                      Notifications
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/settings">
                      <i className="bi bi-gear me-1"></i>
                      Settings
                    </Link>
                  </li>
                  {isAdmin() && (
                    <li className="nav-item dropdown">
                      <button 
                        className="nav-link dropdown-toggle btn btn-link text-white" 
                        type="button"
                        data-bs-toggle="dropdown" 
                        aria-expanded="false"
                      >
                        <i className="bi bi-shield-lock me-1"></i>
                        Admin
                      </button>
                      <ul className="dropdown-menu dropdown-menu-dark">
                        <li>
                          <Link className="dropdown-item" to="/admin/users">
                            <i className="bi bi-people me-2"></i>
                            User Management
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/admin/tenders">
                            <i className="bi bi-file-earmark-check me-2"></i>
                            Tender Management
                          </Link>
                        </li>
                      </ul>
                    </li>
                  )}
                </ul>
                <div className="d-flex align-items-center">
                  <span className="navbar-text me-3">
                    <i className="bi bi-person-circle me-1"></i>
                    {user?.username}
                  </span>
                  <button 
                    className="btn btn-outline-light btn-sm" 
                    onClick={handleLogout}
                    aria-label="Logout from your account"
                  >
                    <i className="bi bi-box-arrow-right me-1"></i>
                    Logout
                  </button>
                </div>
              </div>

              {/* Mobile Hamburger Button */}
              <button 
                className="navbar-toggler d-lg-none" 
                type="button" 
                data-bs-toggle="offcanvas" 
                data-bs-target="#offcanvasNavbar"
                aria-controls="offcanvasNavbar"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
            </>
          ) : (
            <>
              <div className="d-none d-md-flex me-3">
                <Link className="btn btn-outline-light btn-sm me-2" to="/tenders">
                  <i className="bi bi-file-earmark-text me-1"></i>
                  Browse Tenders
                </Link>
              </div>
              <div className="d-flex">
                <Link className="btn btn-outline-light btn-sm me-2" to="/login">
                  Login
                </Link>
                <Link className="btn btn-light btn-sm" to="/register">
                  Register
                </Link>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Offcanvas Sidebar for Mobile */}
      {isAuth && (
        <div 
          className="offcanvas offcanvas-end bg-dark text-white" 
          tabIndex="-1" 
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
        >
          <div className="offcanvas-header border-bottom border-secondary">
            <h5 className="offcanvas-title" id="offcanvasNavbarLabel">
              <i className="bi bi-person-circle me-2"></i>
              {user?.username}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              data-bs-dismiss="offcanvas" 
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body">
            <ul className="navbar-nav flex-column">
              <li className="nav-item mb-2">
                <button 
                  className="nav-link btn btn-link text-white text-start w-100"
                  onClick={() => handleNavClick('/tenders')}
                >
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Browse Tenders
                </button>
              </li>
              <li className="nav-item mb-2">
                <button 
                  className="nav-link btn btn-link text-white text-start w-100"
                  onClick={() => handleNavClick('/recommendations')}
                >
                  <i className="bi bi-stars me-2"></i>
                  Recommendations
                </button>
              </li>
              <li className="nav-item mb-2">
                <button 
                  className="nav-link btn btn-link text-white text-start w-100"
                  onClick={() => handleNavClick('/upload')}
                >
                  <i className="bi bi-cloud-upload me-2"></i>
                  Upload
                </button>
              </li>
              <li className="nav-item mb-2">
                <button 
                  className="nav-link btn btn-link text-white text-start w-100"
                  onClick={() => handleNavClick('/notes')}
                >
                  <i className="bi bi-journal-text me-2"></i>
                  Notes
                </button>
              </li>
              <li className="nav-item mb-2">
                <button 
                  className="nav-link btn btn-link text-white text-start w-100"
                  onClick={() => handleNavClick('/activity')}
                >
                  <i className="bi bi-clock-history me-2"></i>
                  Activity
                </button>
              </li>
              <li className="nav-item mb-2">
                <button 
                  className="nav-link btn btn-link text-white text-start w-100"
                  onClick={() => handleNavClick('/notifications')}
                >
                  <i className="bi bi-bell me-2"></i>
                  Notifications
                </button>
              </li>
              <li className="nav-item mb-2">
                <button 
                  className="nav-link btn btn-link text-white text-start w-100"
                  onClick={() => handleNavClick('/settings')}
                >
                  <i className="bi bi-gear me-2"></i>
                  Settings
                </button>
              </li>
              {isAdmin() && (
                <>
                  <li className="nav-item mb-2">
                    <div className="text-muted small ps-3 mt-3 mb-2">ADMIN</div>
                  </li>
                  <li className="nav-item mb-2">
                    <button 
                      className="nav-link btn btn-link text-white text-start w-100"
                      onClick={() => handleNavClick('/admin/users')}
                    >
                      <i className="bi bi-people me-2"></i>
                      User Management
                    </button>
                  </li>
                  <li className="nav-item mb-2">
                    <button 
                      className="nav-link btn btn-link text-white text-start w-100"
                      onClick={() => handleNavClick('/admin/tenders')}
                    >
                      <i className="bi bi-file-earmark-check me-2"></i>
                      Tender Management
                    </button>
                  </li>
                </>
              )}
            </ul>
            <hr className="border-secondary" />
            <button 
              className="btn btn-outline-light w-100" 
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;