import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { getCurrentUser } from '../utils/auth';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './common/Toast';

const Settings = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const currentUser = getCurrentUser();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Settings state
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    emailNotifications: true,
    securityAlerts: true,
    marketingEmails: false
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsAPI.getSettings();
      setSettings(data);
    } catch (error) {
      showError(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await settingsAPI.updateSettings(settings);
      showSuccess('Settings updated successfully');
    } catch (error) {
      showError(error.message || 'Failed to update settings');
    }
  };

  const validatePassword = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    try {
      await settingsAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      showSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (error) {
      showError(error.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <h1>Settings</h1>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-right" />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Settings</h1>
          <small className="text-muted">Manage your account settings and preferences</small>
        </div>

        <div className="row">
          <div className="col-md-3 mb-4">
            <div className="list-group">
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="bi bi-person me-2"></i>
                Profile
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                <i className="bi bi-gear me-2"></i>
                General
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="bi bi-shield-lock me-2"></i>
                Security
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <i className="bi bi-bell me-2"></i>
                Notifications
              </button>
            </div>
          </div>

          <div className="col-md-9">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-4">Profile Information</h5>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Username
                        <input
                          type="text"
                          className="form-control mt-1"
                          value={currentUser?.username || ''}
                          disabled
                        />
                      </label>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Email
                        <input
                          type="email"
                          className="form-control mt-1"
                          value={currentUser?.email || ''}
                          disabled
                        />
                      </label>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">
                        Role
                        <input
                          type="text"
                          className="form-control text-capitalize mt-1"
                          value={currentUser?.role || ''}
                          disabled
                        />
                      </label>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">
                        Account Status
                        <input
                          type="text"
                          className="form-control mt-1"
                          value={currentUser?.is_verified ? 'Verified' : 'Not Verified'}
                          disabled
                        />
                      </label>
                    </div>
                  </div>
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    To update your email address or change your password, use the Security tab.
                  </div>
                </div>
              </div>
            )}

            {/* General Settings Tab */}
            {activeTab === 'general' && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-4">General Settings</h5>
                  <form onSubmit={handleSaveSettings}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="theme-select">Theme</label>
                      <select
                        id="theme-select"
                        className="form-select"
                        name="theme"
                        value={settings.theme}
                        onChange={handleSettingsChange}
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                      <small className="text-muted">Choose your preferred color scheme</small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label" htmlFor="language-select">Language</label>
                      <select
                        id="language-select"
                        className="form-select"
                        name="language"
                        value={settings.language}
                        onChange={handleSettingsChange}
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <div className="fw-bold mb-2">Account Information</div>
                      <div className="card bg-light">
                        <div className="card-body">
                          <p className="mb-1"><strong>Username:</strong> {currentUser?.username}</p>
                          <p className="mb-0"><strong>Email:</strong> {currentUser?.email}</p>
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-check-lg me-2"></i>
                      Save Changes
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-4">Security Settings</h5>
                  
                  <div className="mb-4">
                    <h6>Change Password</h6>
                    <form onSubmit={handlePasswordChange}>
                      <div className="mb-3">
                        <label className="form-label" htmlFor="current-password">Current Password</label>
                        <input
                          id="current-password"
                          type="password"
                          className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                        {passwordErrors.currentPassword && (
                          <div className="invalid-feedback">{passwordErrors.currentPassword}</div>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className="form-label" htmlFor="new-password">New Password</label>
                        <input
                          id="new-password"
                          type="password"
                          className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        {passwordErrors.newPassword && (
                          <div className="invalid-feedback">{passwordErrors.newPassword}</div>
                        )}
                        <small className="text-muted">Must be at least 6 characters</small>
                      </div>

                      <div className="mb-3">
                        <label className="form-label" htmlFor="confirm-password">Confirm New Password</label>
                        <input
                          id="confirm-password"
                          type="password"
                          className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        />
                        {passwordErrors.confirmPassword && (
                          <div className="invalid-feedback">{passwordErrors.confirmPassword}</div>
                        )}
                      </div>

                      <button type="submit" className="btn btn-warning">
                        <i className="bi bi-key me-2"></i>
                        Change Password
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title mb-4">Notification Preferences</h5>
                  <form onSubmit={handleSaveSettings}>
                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="emailNotifications"
                        checked={settings.emailNotifications}
                        onChange={handleSettingsChange}
                        id="emailNotifications"
                      />
                      <label className="form-check-label" htmlFor="emailNotifications">
                        Email Notifications
                      </label>
                      <div><small className="text-muted">Receive updates and news via email</small></div>
                    </div>

                    <div className="form-check form-switch mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="securityAlerts"
                        checked={settings.securityAlerts}
                        onChange={handleSettingsChange}
                        id="securityAlerts"
                      />
                      <label className="form-check-label" htmlFor="securityAlerts">
                        Security Alerts
                      </label>
                      <div><small className="text-muted">Get notified about security events</small></div>
                    </div>

                    <div className="form-check form-switch mb-4">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="marketingEmails"
                        checked={settings.marketingEmails}
                        onChange={handleSettingsChange}
                        id="marketingEmails"
                      />
                      <label className="form-check-label" htmlFor="marketingEmails">
                        Marketing Emails
                      </label>
                      <div><small className="text-muted">Receive promotional content and offers</small></div>
                    </div>

                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-check-lg me-2"></i>
                      Save Preferences
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
