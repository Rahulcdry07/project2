/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userAPI } from '../services/api';
import { getCurrentUser, setAuthData, getToken } from '../utils/auth';
import { logError } from '../utils/logger';

const Profile = () => {
  const [user, setUser] = useState(getCurrentUser());
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  const [preferences, setPreferences] = useState({
    preferredCategories: [],
    preferredLocations: [],
    emailNotifications: true,
    minTenderValue: '',
    maxTenderValue: ''
  });
  const [userActivity, setUserActivity] = useState({
    totalViewed: 0,
    recentlyViewed: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const categories = [
    'Construction', 'IT Services', 'Consulting', 'Supplies', 
    'Transportation', 'Healthcare', 'Education', 'Engineering', 
    'Maintenance', 'Other'
  ];

  const locations = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 
    'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'
  ];

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || ''
      });
    }
    loadUserActivity();
  }, [user]);

  const loadUserActivity = async () => {
    try {
      // In a real app, this would fetch user's tender viewing history
      // For now, we'll simulate some activity
      setUserActivity({
        totalViewed: Math.floor(Math.random() * 20) + 5,
        recentlyViewed: []
      });
    } catch (err) {
      logError('Failed to load user activity:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'preferredCategories' || name === 'preferredLocations') {
        setPreferences(prev => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value]
            : prev[name].filter(item => item !== value)
        }));
      } else {
        setPreferences(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setPreferences(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      // In a real app, this would save preferences to the backend
      // For now, we'll just show a success message
      setMessage('Preferences saved successfully!');
    } catch (err) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>User Profile</h1>
        <Link to="/dashboard" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-1"></i>
          Back to Dashboard
        </Link>
      </div>
      
      {message && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
        </div>
      )}

      <div className="row">
        {/* Profile Information */}
        <div className="col-lg-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-person me-2"></i>
                Profile Information
              </h5>
            </div>
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

                <div className="mb-3">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </small>
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

          {/* Activity Summary */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-activity me-2"></i>
                Activity Summary
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-4">
                  <h4 className="text-primary">{userActivity.totalViewed}</h4>
                  <small className="text-muted">Tenders Viewed</small>
                </div>
                <div className="col-4">
                  <h4 className="text-success">0</h4>
                  <small className="text-muted">Applications</small>
                </div>
                <div className="col-4">
                  <h4 className="text-info">0</h4>
                  <small className="text-muted">Saved Tenders</small>
                </div>
              </div>
              <hr />
              <div className="d-grid gap-2">
                <Link to="/tenders" className="btn btn-outline-primary btn-sm">
                  <i className="bi bi-search me-1"></i>
                  Browse More Tenders
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tender Preferences */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                Tender Preferences
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handlePreferencesSubmit}>
                {/* Preferred Categories */}
                <div className="mb-4">
                  <label className="form-label">Preferred Categories</label>
                  <div className="row">
                    {categories.map(category => (
                      <div key={category} className="col-6 mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`category-${category}`}
                            name="preferredCategories"
                            value={category}
                            checked={preferences.preferredCategories.includes(category)}
                            onChange={handlePreferenceChange}
                          />
                          <label className="form-check-label small" htmlFor={`category-${category}`}>
                            {category}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferred Locations */}
                <div className="mb-4">
                  <label className="form-label">Preferred Locations</label>
                  <div className="row">
                    {locations.map(location => (
                      <div key={location} className="col-6 mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`location-${location}`}
                            name="preferredLocations"
                            value={location}
                            checked={preferences.preferredLocations.includes(location)}
                            onChange={handlePreferenceChange}
                          />
                          <label className="form-check-label small" htmlFor={`location-${location}`}>
                            {location}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Value Range */}
                <div className="mb-4">
                  <label className="form-label">Tender Value Range (₹)</label>
                  <div className="row">
                    <div className="col-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Min value"
                        name="minTenderValue"
                        value={preferences.minTenderValue}
                        onChange={handlePreferenceChange}
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Max value"
                        name="maxTenderValue"
                        value={preferences.maxTenderValue}
                        onChange={handlePreferenceChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="emailNotifications"
                      name="emailNotifications"
                      checked={preferences.emailNotifications}
                      onChange={handlePreferenceChange}
                    />
                    <label className="form-check-label" htmlFor="emailNotifications">
                      Email notifications for new tenders
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card bg-light">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-lightning me-2"></i>
                Quick Actions
              </h5>
              <div className="row">
                <div className="col-md-3">
                  <Link to="/tenders" className="btn btn-outline-primary w-100 mb-2">
                    <i className="bi bi-search me-1"></i>
                    Browse Tenders
                  </Link>
                </div>
                <div className="col-md-3">
                  <Link to="/tenders?status=Active" className="btn btn-outline-success w-100 mb-2">
                    <i className="bi bi-list-check me-1"></i>
                    Active Tenders
                  </Link>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-info w-100 mb-2" disabled>
                    <i className="bi bi-bookmark me-1"></i>
                    Saved Tenders
                  </button>
                </div>
                <div className="col-md-3">
                  <button className="btn btn-outline-warning w-100 mb-2" disabled>
                    <i className="bi bi-file-text me-1"></i>
                    My Applications
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;