import React, { useState } from 'react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setIsError(false);
        setIsLoading(true);

        // Client-side validation
        if (!email) {
            setMessage('Email address is required.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
        if (!emailRegex.test(email)) {
            setMessage('Please enter a valid email address.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(result.message);
                setIsError(false);
            } else {
                setMessage(result.error);
                setIsError(true);
            }
        } catch (error) {
            setMessage('Network error sending reset link.');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '24rem' }}>
                <h2 className="card-title text-center mb-4">Forgot Your Password?</h2>
                <p className="text-center mb-3">Enter your email address and we will send you a link to reset your password.</p>
                <form onSubmit={handleSubmit}>
                    {message && isError && <div className="alert alert-danger" role="alert">{message}</div>}
                    {message && !isError && <div className="alert alert-success" role="alert">{message}</div>}
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
                    <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
