import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser, clearAuthData, isAdmin } from '../utils/auth';
import { notificationAPI } from '../services/api';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAuth = isAuthenticated();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (isAuth) {
        try {
          const notifications = await notificationAPI.getAll();
          const unread = notifications.filter(n => !n.is_read).length;
          setUnreadCount(unread);
        } catch (error) {
          // Silently fail - notification count is not critical
        }
      }
    };

    fetchUnreadCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuth]);

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

  const handleNavClick = path => {
    closeOffcanvas();
    setTimeout(() => navigate(path), 300);
  };

  return (
    <>
      <style>{`
        .navbar .dropdown-menu {
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          margin-top: 0.125rem !important;
        }
        .navbar .dropdown {
          position: relative !important;
        }
      `}</style>
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
                <ul className="navbar-nav me-auto ms-4 flex-row gap-2">
                  {/* Home/Dashboard Link */}
                  <li className="nav-item">
                    <Link className="nav-link px-3" to="/dashboard">
                      <i className="bi bi-house-door me-1"></i>
                      Home
                    </Link>
                  </li>

                  {/* Browse Dropdown */}
                  <li className="nav-item dropdown">
                    <button
                      className="nav-link dropdown-toggle btn btn-link text-white px-3"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-grid-3x3-gap me-1"></i>
                      Browse
                    </button>
                    <ul className="dropdown-menu dropdown-menu-dark">
                      <li>
                        <Link className="dropdown-item" to="/tenders">
                          <i className="bi bi-file-earmark-text me-2"></i>
                          All Tenders
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/recommendations">
                          <i className="bi bi-stars me-2"></i>
                          Recommendations
                        </Link>
                      </li>
                    </ul>
                  </li>

                  {/* Tools Dropdown */}
                  <li className="nav-item dropdown">
                    <button
                      className="nav-link dropdown-toggle btn btn-link text-white px-3"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-tools me-1"></i>
                      Tools
                    </button>
                    <ul className="dropdown-menu dropdown-menu-dark">
                      <li>
                        <Link className="dropdown-item" to="/upload">
                          <i className="bi bi-cloud-upload me-2"></i>
                          Upload Files
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/notes">
                          <i className="bi bi-journal-text me-2"></i>
                          Notes
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/activity">
                          <i className="bi bi-clock-history me-2"></i>
                          Activity Log
                        </Link>
                      </li>
                    </ul>
                  </li>

                  {/* Admin Dropdown */}
                  {isAdmin() && (
                    <li className="nav-item dropdown">
                      <button
                        className="nav-link dropdown-toggle btn btn-link text-white px-3"
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

                <div className="d-flex align-items-center gap-3">
                  {/* Notifications Icon */}
                  <Link
                    className="position-relative text-white text-decoration-none d-flex align-items-center"
                    to="/notifications"
                    aria-label="Notifications"
                    style={{ padding: '0.5rem' }}
                  >
                    <i className="bi bi-bell fs-5"></i>
                    {unreadCount > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: '0.6rem' }}
                      >
                        {unreadCount}
                        <span className="visually-hidden">{unreadCount} unread notifications</span>
                      </span>
                    )}
                  </Link>

                  {/* User Dropdown */}
                  <div className="dropdown">
                    <button
                      className="btn btn-link nav-link dropdown-toggle text-white d-flex align-items-center px-3"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-person-circle me-2 fs-5"></i>
                      {user?.username}
                    </button>
                    <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end">
                      <li>
                        <Link className="dropdown-item" to="/settings">
                          <i className="bi bi-gear me-2"></i>
                          Settings
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
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
              {/* Home/Dashboard */}
              <li className="nav-item mb-3">
                <button
                  className="nav-link btn btn-link text-white text-start w-100"
                  onClick={() => handleNavClick('/dashboard')}
                >
                  <i className="bi bi-house-door me-2"></i>
                  Home
                </button>
              </li>

              {/* Browse Section */}
              <li className="nav-item mb-1">
                <div
                  className="text-muted small ps-3 mb-2 text-uppercase"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                >
                  <i className="bi bi-grid-3x3-gap me-1"></i>
                  Browse
                </div>
              </li>
              <li className="nav-item mb-2">
                <button
                  className="nav-link btn btn-link text-white text-start w-100 ps-4"
                  onClick={() => handleNavClick('/tenders')}
                >
                  <i className="bi bi-file-earmark-text me-2"></i>
                  All Tenders
                </button>
              </li>
              <li className="nav-item mb-3">
                <button
                  className="nav-link btn btn-link text-white text-start w-100 ps-4"
                  onClick={() => handleNavClick('/recommendations')}
                >
                  <i className="bi bi-stars me-2"></i>
                  Recommendations
                </button>
              </li>

              {/* Tools Section */}
              <li className="nav-item mb-1">
                <div
                  className="text-muted small ps-3 mb-2 text-uppercase"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                >
                  <i className="bi bi-tools me-1"></i>
                  Tools
                </div>
              </li>
              <li className="nav-item mb-2">
                <button
                  className="nav-link btn btn-link text-white text-start w-100 ps-4"
                  onClick={() => handleNavClick('/upload')}
                >
                  <i className="bi bi-cloud-upload me-2"></i>
                  Upload Files
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className="nav-link btn btn-link text-white text-start w-100 ps-4"
                  onClick={() => handleNavClick('/notes')}
                >
                  <i className="bi bi-journal-text me-2"></i>
                  Notes
                </button>
              </li>
              <li className="nav-item mb-3">
                <button
                  className="nav-link btn btn-link text-white text-start w-100 ps-4"
                  onClick={() => handleNavClick('/activity')}
                >
                  <i className="bi bi-clock-history me-2"></i>
                  Activity Log
                </button>
              </li>

              {/* Account Section */}
              <li className="nav-item mb-1">
                <div
                  className="text-muted small ps-3 mb-2 text-uppercase"
                  style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                >
                  <i className="bi bi-person-circle me-1"></i>
                  Account
                </div>
              </li>
              <li className="nav-item mb-2">
                <button
                  className="nav-link btn btn-link text-white text-start w-100 ps-4 position-relative"
                  onClick={() => handleNavClick('/notifications')}
                >
                  <i className="bi bi-bell me-2"></i>
                  Notifications
                  {unreadCount > 0 && (
                    <span className="badge bg-danger ms-2" style={{ fontSize: '0.65rem' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </li>
              <li className="nav-item mb-3">
                <button
                  className="nav-link btn btn-link text-white text-start w-100 ps-4"
                  onClick={() => handleNavClick('/settings')}
                >
                  <i className="bi bi-gear me-2"></i>
                  Settings
                </button>
              </li>

              {/* Admin Section */}
              {isAdmin() && (
                <>
                  <li className="nav-item mb-1">
                    <div
                      className="text-warning small ps-3 mb-2 text-uppercase"
                      style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}
                    >
                      <i className="bi bi-shield-lock me-1"></i>
                      Admin
                    </div>
                  </li>
                  <li className="nav-item mb-2">
                    <button
                      className="nav-link btn btn-link text-white text-start w-100 ps-4"
                      onClick={() => handleNavClick('/admin/users')}
                    >
                      <i className="bi bi-people me-2"></i>
                      User Management
                    </button>
                  </li>
                  <li className="nav-item mb-3">
                    <button
                      className="nav-link btn btn-link text-white text-start w-100 ps-4"
                      onClick={() => handleNavClick('/admin/tenders')}
                    >
                      <i className="bi bi-file-earmark-check me-2"></i>
                      Tender Management
                    </button>
                  </li>
                </>
              )}
            </ul>
            <hr className="border-secondary my-3" />
            <button className="btn btn-outline-light w-100" onClick={handleLogout}>
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
