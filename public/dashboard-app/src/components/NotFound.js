import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm text-center" style={{ width: '24rem' }}>
                <h1 className="display-1 text-muted">404</h1>
                <h2 className="card-title mb-4">Page Not Found</h2>
                <p className="text-muted mb-4">
                    The page you are looking for doesn't exist or has been moved.
                </p>
                <div className="d-grid gap-2">
                    <Link to="/login" className="btn btn-primary">
                        Go to Login
                    </Link>
                    <Link to="/register" className="btn btn-outline-secondary">
                        Create Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound; 