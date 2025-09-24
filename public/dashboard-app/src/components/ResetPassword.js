import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    const getTokenFromUrl = () => {
        const params = new URLSearchParams(location.search);
        return params.get('token');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages

        if (password !== confirmPassword) {
            setMessage('Error: Passwords do not match.');
            return;
        }

        const token = getTokenFromUrl();
        if (!token) {
            setMessage('Error: Password reset token is missing.');
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(result.message);
                // Optionally redirect to login after successful reset
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setMessage(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setMessage('Network error resetting password.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '24rem' }}>
                <h2 className="card-title text-center mb-4">Reset Your Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="confirm-password" className="form-label">Confirm New Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="confirm-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Reset Password</button>
                </form>
                {message && <p className="text-center mt-3" id="message">{message}</p>}
            </div>
        </div>
    );
};

export default ResetPassword;
