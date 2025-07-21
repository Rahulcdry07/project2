import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
    const [message, setMessage] = useState('Verifying your email...');
    const [isError, setIsError] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');

            if (!token) {
                setMessage('Verification token is missing.');
                setIsError(true);
                return;
            }

            try {
                const response = await fetch('/api/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const result = await response.json();

                if (response.ok) {
                    setMessage(result.message);
                    setIsError(false);
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setMessage(result.error);
                    setIsError(true);
                }
            } catch (error) {
                setMessage('Network error verifying email.');
                setIsError(true);
            }
        };
        verifyEmail();
    }, [location.search, navigate]);

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '24rem' }}>
                <h2 className="card-title text-center mb-4">Verify Your Email Address</h2>
                {isError ? (
                    <div className="alert alert-danger" role="alert">{message}</div>
                ) : (
                    <div className="alert alert-success" role="alert">{message}</div>
                )}
                <div className="text-center mt-3">
                    <a href="/login" className="btn btn-link">Back to Login</a>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
