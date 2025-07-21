import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(''); // Clear previous errors
        setSuccessMessage(''); // Clear previous success messages
        setIsLoading(true);

        // Client-side validation
        if (!email || !password) {
            setErrorMessage('Email and password are required.');
            setIsLoading(false);
            return;
        }

        // Basic email format validation
        const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(email)) {
            setErrorMessage('Please enter a valid email address.');
            setIsLoading(false);
            return;
        }

        // Password length validation
        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (response.ok) {
                setSuccessMessage(result.message);
                localStorage.setItem('token', result.token);
                localStorage.setItem('refreshToken', result.refreshToken);
                await refreshUser(); // Immediately update auth context
                setTimeout(() => {
                    navigate(result.redirect || '/dashboard');
                }, 1000);
            } else {
                setErrorMessage(result.error || 'An unexpected error occurred.');
            }
        } catch (error) {
            setErrorMessage('Error logging in. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '24rem' }}>
                <h2 className="card-title text-center mb-4">Login to Your Account</h2>
                <form onSubmit={handleSubmit}>
                    {errorMessage && <div className="alert alert-danger" role="alert">{errorMessage}</div>}
                    {successMessage && <div className="alert alert-success" role="alert">{successMessage}</div>}
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
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="text-center mt-3">
                    Don't have an account? <a href="/register">Register</a>
                    <br />
                    <a href="/forgot-password">Forgot your password?</a>
                </p>
            </div>
        </div>
    );
};

export default Login;
