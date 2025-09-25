import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/auth';

/**
 * Navigation bar component
 */
const Navbar = () => {
    const { currentUser, logout, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/dashboard">
                    <i className="bi bi-shield-lock me-2"></i>
                    SecureReg
                </Link>
                <button 
                    className="navbar-toggler" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#navbarNav" 
                    aria-controls="navbarNav" 
                    aria-expanded="false" 
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        {!loading && currentUser ? (
                            <>
                                <li className="nav-item">
                                    <Link 
                                        className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} 
                                        to="/dashboard"
                                    >
                                        <i className="bi bi-speedometer2 me-1"></i>
                                        Dashboard
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link 
                                        className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`} 
                                        to="/profile"
                                    >
                                        <i className="bi bi-person me-1"></i>
                                        Profile
                                    </Link>
                                </li>
                                {isAdmin() && (
                                    <li className="nav-item">
                                        <Link 
                                            className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`} 
                                            to="/admin"
                                        >
                                            <i className="bi bi-gear me-1"></i>
                                            Admin
                                        </Link>
                                    </li>
                                )}
                                <li className="nav-item">
                                    <button 
                                        className="nav-link btn btn-link" 
                                        onClick={handleLogout}
                                    >
                                        <i className="bi bi-box-arrow-right me-1"></i>
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link 
                                        className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`} 
                                        to="/login"
                                    >
                                        <i className="bi bi-box-arrow-in-right me-1"></i>
                                        Login
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link 
                                        className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`} 
                                        to="/register"
                                    >
                                        <i className="bi bi-person-plus me-1"></i>
                                        Register
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;