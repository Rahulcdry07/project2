import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch('/api/profile', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const data = await response.json();
                if (response.ok) {
                    setUsername(data.username);
                    setEmail(data.email);
                } else if (data.error === 'Token expired.' || data.error === 'Invalid token.' || data.error === 'No token provided.') {
                    localStorage.removeItem('token');
                    navigate('/login');
                } else {
                    setMessage(`Error: ${data.error}`);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setMessage('Network error fetching profile.');
                localStorage.removeItem('token');
                navigate('/login');
            }
        };
        fetchProfile();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ username, email }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(result.message || 'Profile updated successfully!');
            } else {
                setMessage(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Network error updating profile.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '24rem' }}>
                <h2 className="card-title text-center mb-4">Your Profile</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-control"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Update Profile</button>
                </form>
                {message && <p className="text-center mt-3" id="message">{message}</p>}
            </div>
        </div>
    );
};

export default Profile;
