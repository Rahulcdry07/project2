import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Navbar.css';

function getInitials(user) {
    if (!user) return '';
    if (user.username && user.username.trim()) {
        return user.username.trim().split(' ').map(word => word[0].toUpperCase()).join('').slice(0, 2);
    }
    if (user.email && user.email.trim()) {
        return user.email[0].toUpperCase();
    }
    return '';
}

const Navbar = () => {
    const { user, isLoggedIn, isLoading } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    //const navigate = useNavigate();
    //const location = useLocation();
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            });
            const result = await response.json();
            if (result.message === 'Logout successful.') {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            } else {
                alert('Logout failed: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            alert('Network error during logout.');
        }
    };

    // Navigation links logic
    const navLinks = [
        { to: '/', label: 'Home', show: !isLoading },
        { to: '/dashboard', label: 'Dashboard', show: isLoggedIn && !isLoading },
        { to: '/admin', label: 'Admin', show: isLoggedIn && user?.role === 'admin' && !isLoading },
    ];

    return (
        <nav className="modern-navbar glassy-navbar shadow-sm">
            <div className="navbar-content container-fluid px-3">
                {/* Logo/Brand */}
                <div className="navbar-brand d-flex align-items-center gap-2">
                    <Link to="/" className="brand-link d-flex align-items-center">
                        <img src="/logo192.png" alt="Logo" className="navbar-logo me-2" style={{width:32, height:32}} />
                        <span className="fw-bold gradient-text fs-5">UserPlatform</span>
                    </Link>
                </div>
                {/* Hamburger for mobile */}
                <button className="navbar-toggler d-lg-none" type="button" aria-label="Toggle navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                {/* Center nav links */}
                <div className={`navbar-links flex-grow-1 justify-content-center d-none d-lg-flex`}> 
                    {!isLoading && navLinks.filter(link => link.show).map(link => (
                        <Link key={link.to} to={link.to} className="nav-link mx-2 px-3 py-2 rounded-pill fw-semibold">
                            {link.label}
                        </Link>
                    ))}
                </div>
                {/* User section */}
                <div className="navbar-user d-flex align-items-center ms-auto">
                    {!isLoading && (isLoggedIn ? (
                        <div className="user-dropdown position-relative" ref={dropdownRef}>
                            <button className="user-btn d-flex align-items-center gap-2 px-2 py-1 rounded-pill border-0 bg-transparent" onClick={() => setDropdownOpen(!dropdownOpen)}>
                                <div className="navbar-initials-avatar rounded-circle shadow-sm d-flex align-items-center justify-content-center" style={{ width: 36, height: 36, background: '#e3eaf2', color: '#007bff', fontWeight: 700, fontSize: 18, border: '2px solid #007bff' }}>
                                    {getInitials(user) || <i className="bi bi-person"></i>}
                                </div>
                                <span className="fw-semibold text-primary d-none d-md-inline">{user?.username}</span>
                                <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} ms-1`}></i>
                            </button>
                            {dropdownOpen && (
                                <div className="dropdown-menu show glassy-dropdown shadow position-absolute end-0 mt-2 py-2 rounded-4 animate__animated animate__fadeIn" style={{ minWidth: '180px', zIndex: 100 }}>
                                    <Link to="/profile" className="dropdown-item py-2 px-3" onClick={() => setDropdownOpen(false)}><i className="bi bi-person me-2"></i> Profile</Link>
                                    <Link to="/settings" className="dropdown-item py-2 px-3" onClick={() => setDropdownOpen(false)}><i className="bi bi-gear me-2"></i> Settings</Link>
                                    <div className="dropdown-divider my-1"></div>
                                    <button className="dropdown-item py-2 px-3 text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2"></i> Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="d-flex gap-2">
                            <Link to="/login" className="btn btn-outline-primary rounded-pill px-4">Login</Link>
                            <Link to="/register" className="btn btn-primary rounded-pill px-4">Register</Link>
                        </div>
                    ))}
                </div>
            </div>
            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="mobile-menu glassy-navbar d-lg-none animate__animated animate__fadeInDown shadow position-absolute w-100" style={{top:'100%', left:0, zIndex:200}}>
                    <div className="d-flex flex-column align-items-center py-3">
                        {!isLoading && navLinks.filter(link => link.show).map(link => (
                            <Link key={link.to} to={link.to} className="nav-link my-2 fs-5" onClick={()=>setMobileMenuOpen(false)}>{link.label}</Link>
                        ))}
                        {!isLoading && (isLoggedIn ? (
                            <button className="btn btn-outline-danger rounded-pill mt-3 px-4" onClick={handleLogout}>Logout</button>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-outline-primary rounded-pill mt-3 px-4" onClick={()=>setMobileMenuOpen(false)}>Login</Link>
                                <Link to="/register" className="btn btn-primary rounded-pill mt-2 px-4" onClick={()=>setMobileMenuOpen(false)}>Register</Link>
                            </>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
