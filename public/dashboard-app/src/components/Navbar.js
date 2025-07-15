import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
    const [userRole, setUserRole] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        console.log('Current pathname:', location.pathname);
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            const fetchUserRole = async () => {
                try {
                    const response = await fetch('/api/profile', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    const user = await response.json();
                    if (response.ok) {
                        setUserRole(user.role);
                    } else {
                        console.error('Failed to fetch user role:', user.error);
                        localStorage.removeItem('token');
                        setUserRole(null);
                        setIsLoggedIn(false);
                    }
                } catch (error) {
                    console.error('Network error fetching user role:', error);
                    localStorage.removeItem('token');
                    setUserRole(null);
                    setIsLoggedIn(false);
                }
            };
            fetchUserRole();
        } else {
            setIsLoggedIn(false);
            setUserRole(null);
        }
    }, [location.pathname]); // Re-fetch role if path changes

    const handleLogout = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
            });
            const result = await response.json();
            if (result.message === 'Logout successful.') {
                localStorage.removeItem('token');
                setUserRole(null); // Clear role on logout
                navigate('/login');
            } else {
                alert('Logout failed: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            alert('Network error during logout.');
        }
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/dashboard">SecureReg</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        {isLoggedIn ? (
                            <>
                                {console.log('Condition for Dashboard link:', location.pathname !== '/dashboard')}
                                <li className="nav-item">
                                    <Link className="nav-link" to="/dashboard">Dashboard</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/profile">Profile</Link>
                                </li>
                                {userRole === 'admin' && (
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin">Admin</Link>
                                    </li>
                                )}
                                <li className="nav-item">
                                    <button className="nav-link btn btn-link" onClick={handleLogout} style={{ textDecoration: 'none', color: 'inherit' }}>Logout</button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login">Login</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/register">Register</Link>
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
