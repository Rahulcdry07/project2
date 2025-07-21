import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const getTokenFromUrl = () => {
        const params = new URLSearchParams(location.search);
        return params.get('token');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setIsError(false);
        setIsLoading(true);

        // Client-side validation
        if (!password || !confirmPassword) {
            setMessage('Both password fields are required.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setMessage('Passwords do not match.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        // Password complexity validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            setMessage(
                'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).'
            );
            setIsError(true);
            setIsLoading(false);
            return;
        }

        const token = getTokenFromUrl();
        if (!token) {
            setMessage('Password reset token is missing.');
            setIsError(true);
            setIsLoading(false);
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
                setIsError(false);
                // Optionally redirect to login after successful reset
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setMessage(result.error);
                setIsError(true);
            }
        } catch (error) {
            setMessage('Network error resetting password.');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '24rem' }}>
                <h2 className="card-title text-center mb-4">Reset Your Password</h2>
                <form onSubmit={handleSubmit}>
                    {message && isError && <div className="alert alert-danger" role="alert">{message}</div>}
                    {message && !isError && <div className="alert alert-success" role="alert">{message}</div>}
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
                        <div className="form-text">
                            <small>Password must be at least 8 characters long and contain:</small>
                            <ul className="mb-0" style={{ fontSize: '0.8em' }}>
                                <li>At least one uppercase letter (A-Z)</li>
                                <li>At least one lowercase letter (a-z)</li>
                                <li>At least one number (0-9)</li>
                                <li>At least one special character (@$!%*?&)</li>
                            </ul>
                        </div>
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
                    <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                        {isLoading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
