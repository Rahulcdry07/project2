import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
    const [message, setMessage] = useState('Verifying your email...');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyEmail = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');

            if (!token) {
                setMessage('Error: Verification token is missing.');
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
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    setMessage(`Error: ${result.error}`);
                }
            } catch (error) {
                console.error('Error verifying email:', error);
                setMessage('Network error verifying email.');
            }
        };
        verifyEmail();
    }, [location.search, navigate]);

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '24rem' }}>
                <h2 className="card-title text-center mb-4">Email Verification</h2>
                <p className="text-center mt-3" id="message">{message}</p>
            </div>
        </div>
    );
};

export default VerifyEmail;
