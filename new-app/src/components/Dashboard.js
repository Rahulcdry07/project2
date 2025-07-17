import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch('/api/profile', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const user = await response.json();
                if (response.ok) {
                    setUsername(user.username);
                } else if (user.error === 'Token expired.' || user.error === 'Invalid token.' || user.error === 'No token provided.') {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                localStorage.removeItem('token');
                navigate('/login');
            }
        };
        fetchUser();
    }, [navigate]);

    return (
        <div className="container">
            <header className="main-header">
                <h1>Dashboard</h1>
                <p>Welcome to your dashboard, <span id="username">{username}</span>!</p>
            </header>
            {/* Placeholder for other dashboard content */}
            <p>More dashboard content will go here.</p>
        </div>
    );
};

export default Dashboard;
