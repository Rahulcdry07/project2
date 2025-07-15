import React, { useState } from 'react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(result.message);
            } else {
                setMessage(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Error sending reset link:', error);
            setMessage('Network error sending reset link.');
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '24rem' }}>
                <h2 className="card-title text-center mb-4">Forgot Your Password?</h2>
                <p className="text-center mb-3">Enter your email address and we will send you a link to reset your password.</p>
                <form onSubmit={handleSubmit}>
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
                    <button type="submit" className="btn btn-primary w-100">Send Reset Link</button>
                </form>
                {message && <p className="text-center mt-3" id="message">{message}</p>}
            </div>
        </div>
    );
};

export default ForgotPassword;
