import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token, verifyEmail]);

  const verifyEmail = useCallback(async () => {
    try {
      await authAPI.verifyEmail(token);
      setStatus('success');
      setMessage('Email verified successfully! You can now login.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Email verification failed');
    }
  }, [token]);

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card">
          <div className="card-body text-center">
            <h1 className="card-title mb-4">Email Verification</h1>
            
            {status === 'verifying' && (
              <div>
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p>Verifying your email...</p>
              </div>
            )}
            
            {status === 'success' && (
              <div>
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {message}
                </div>
                <Link to="/login" className="btn btn-primary">
                  Go to Login
                </Link>
              </div>
            )}
            
            {status === 'error' && (
              <div>
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {message}
                </div>
                <Link to="/login" className="btn btn-primary me-2">
                  Go to Login
                </Link>
                <Link to="/register" className="btn btn-outline-primary">
                  Register Again
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;