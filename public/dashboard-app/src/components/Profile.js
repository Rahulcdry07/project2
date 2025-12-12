import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { getCurrentUser, setAuthData, getToken } from '../utils/auth';
import { SkeletonForm } from './common/SkeletonLoader';
import ErrorDisplay from './common/ErrorDisplay';
import { ToastContainer } from './common/Toast';
import { useToast } from '../hooks/useToast';

const Profile = () => {
  const { toasts, removeToast, showSuccess } = useToast();
  const [user, setUser] = useState(getCurrentUser());
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 200));
        setFormData({
          username: user.username || '',
          email: user.email || ''
        });
      }
      setInitialLoading(false);
    };
    
    loadProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const updatedUser = await userAPI.updateProfile(formData);
      setUser(updatedUser);
      setAuthData(updatedUser, getToken());
      setMessage('Profile updated successfully!');
      showSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryUpdate = () => {
    setError('');
  };

  if (initialLoading) {
    return (
      <div className="container mt-4">
        <div style={{
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'pulse 1.5s ease-in-out infinite',
          width: '150px',
          height: '32px',
          borderRadius: '4px',
          marginBottom: '24px',
        }} />
        <SkeletonForm fields={2} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-right" />
      <div className="container mt-4">
        <h1>User Profile</h1>
      
      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')} aria-label="Close"></button>
        </div>
      )}
      
      <ErrorDisplay 
        error={error} 
        onRetry={handleRetryUpdate}
        retryText="Clear Error"
      />

      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default Profile;