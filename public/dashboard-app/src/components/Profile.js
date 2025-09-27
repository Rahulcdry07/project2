import React, { useState, useEffect } from 'react';
import { getCurrentUser, setAuthData, getToken } from '../utils/auth';

const Profile = () => {
  const [user, setUser] = useState(getCurrentUser());
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    location: '',
    website: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || ''
      });
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        setFormData({
          username: userData.user.username || '',
          email: userData.user.email || '',
          bio: userData.user.bio || '',
          location: userData.user.location || '',
          website: userData.user.website || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAuthData(data.user, getToken());
        setMessage('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setMessage('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to change password');
      }
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePicture) return;

    setIsUploadingPicture(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('Profile picture updated successfully!');
        setUser({ ...user, profilePicture: data.profilePicture });
        setProfilePicture(null);
        setProfilePicturePreview(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to upload profile picture');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['danger', 'warning', 'warning', 'info', 'success'];
    
    return {
      level: levels[strength - 1] || 'Very Weak',
      color: colors[strength - 1] || 'danger',
      percentage: (strength / 5) * 100
    };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body text-center">
              <div className="position-relative">
                <img
                  src={profilePicturePreview || user?.profilePicture || '/default-avatar.png'}
                  alt="Profile"
                  className="rounded-circle mb-3"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
                <button 
                  className="btn btn-sm btn-outline-primary position-absolute bottom-0 end-0"
                  onClick={() => document.getElementById('profilePictureInput').click()}
                  style={{ borderRadius: '50%', width: '30px', height: '30px' }}
                >
                  <i className="bi bi-camera"></i>
                </button>
              </div>
              <h5>{user?.username || 'User'}</h5>
              <p className="text-muted">{user?.email}</p>
              
              {profilePicture && (
                <div className="mt-3">
                  <button 
                    className="btn btn-success btn-sm me-2"
                    onClick={handleProfilePictureUpload}
                    disabled={isUploadingPicture}
                  >
                    {isUploadingPicture ? 'Uploading...' : 'Upload'}
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setProfilePicture(null);
                      setProfilePicturePreview(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              
              <input
                id="profilePictureInput"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfilePictureChange}
              />
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-body">
              <h6 className="card-title">Account Stats</h6>
              <ul className="list-unstyled">
                <li className="d-flex justify-content-between">
                  <small>Role:</small>
                  <span className={`badge ${user?.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                    {user?.role || 'user'}
                  </span>
                </li>
                <li className="d-flex justify-content-between">
                  <small>Member Since:</small>
                  <small>{user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}</small>
                </li>
                <li className="d-flex justify-content-between">
                  <small>Status:</small>
                  <span className="badge bg-success">Active</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-9">
          {message && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              {message}
              <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
            </div>
          )}
          
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="bi bi-person me-1"></i>
                Profile Information
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="bi bi-shield-lock me-1"></i>
                Security
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <i className="bi bi-gear me-1"></i>
                Preferences
              </button>
            </li>
          </ul>

          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-person-lines-fill me-2"></i>
                  Profile Information
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="username" className="form-label">
                          <i className="bi bi-person me-1"></i>
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
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                          <i className="bi bi-envelope me-1"></i>
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
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="location" className="form-label">
                          <i className="bi bi-geo-alt me-1"></i>
                          Location
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="City, Country"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="website" className="form-label">
                          <i className="bi bi-globe me-1"></i>
                          Website
                        </label>
                        <input
                          type="url"
                          className="form-control"
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="bio" className="form-label">
                      <i className="bi bi-card-text me-1"></i>
                      Bio
                    </label>
                    <textarea
                      className="form-control"
                      id="bio"
                      name="bio"
                      rows="3"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    <i className="bi bi-save me-1"></i>
                    {isLoading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-shield-lock me-2"></i>
                  Security Settings
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handlePasswordSubmit}>
                  <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                    {passwordData.newPassword && (
                      <div className="mt-2">
                        <div className="progress" style={{ height: '5px' }}>
                          <div 
                            className={`progress-bar bg-${passwordStrength.color}`}
                            style={{ width: `${passwordStrength.percentage}%` }}
                          ></div>
                        </div>
                        <small className={`text-${passwordStrength.color}`}>
                          Password Strength: {passwordStrength.level}
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                    {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <small className="text-danger">Passwords do not match</small>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-warning"
                    disabled={isLoading || passwordData.newPassword !== passwordData.confirmPassword}
                  >
                    <i className="bi bi-key me-1"></i>
                    {isLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-gear me-2"></i>
                  Advanced Features
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Image Processing</h6>
                    <ul className="list-unstyled">
                      <li><i className="bi bi-check text-success"></i> WebP optimization</li>
                      <li><i className="bi bi-check text-success"></i> Multi-resolution thumbnails</li>
                      <li><i className="bi bi-check text-success"></i> Automatic compression</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6>Security Features</h6>
                    <ul className="list-unstyled">
                      <li><i className="bi bi-check text-success"></i> XSS protection</li>
                      <li><i className="bi bi-check text-success"></i> Advanced validation</li>
                      <li><i className="bi bi-check text-success"></i> Rate limiting</li>
                    </ul>
                  </div>
                </div>
                
                <hr />
                
                <div className="row">
                  <div className="col-md-6">
                    <h6>File Management</h6>
                    <ul className="list-unstyled">
                      <li><i className="bi bi-check text-success"></i> Compression analysis</li>
                      <li><i className="bi bi-check text-success"></i> Batch operations</li>
                      <li><i className="bi bi-check text-success"></i> Search & filter</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <h6>Performance</h6>
                    <ul className="list-unstyled">
                      <li><i className="bi bi-check text-success"></i> Database optimization</li>
                      <li><i className="bi bi-check text-success"></i> Metrics monitoring</li>
                      <li><i className="bi bi-check text-success"></i> Caching system</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;