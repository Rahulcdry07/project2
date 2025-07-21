import React from 'react';

const ProfileForm = ({
  username, email, bio, location, website, githubUrl, linkedinUrl, twitterUrl, profilePrivacy,
  onChange, onSubmit, isLoading, message, profileCompletion
}) => {
  return (
    <form onSubmit={onSubmit} className="glassy-card p-4 rounded-4 shadow mb-4">
      <h4 className="mb-3">Edit Profile</h4>
      {/* Profile Completion Progress */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-muted">Profile Completion</span>
          <span className="text-muted">{profileCompletion}%</span>
        </div>
        <div className="progress" style={{ height: 8 }}>
          <div className="progress-bar bg-info" role="progressbar" style={{ width: `${profileCompletion}%`, transition: 'width 0.6s cubic-bezier(.4,2,.6,1)' }}></div>
        </div>
      </div>
      {message && message.startsWith('Error:') && <div className="alert alert-danger" role="alert">{message}</div>}
      {message && !message.startsWith('Error:') && <div className="alert alert-success" role="alert">{message}</div>}
      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="username" className="form-label"><i className="bi bi-person me-1"></i> Username</label>
          <input type="text" className="form-control" id="username" value={username} onChange={e => onChange('username', e.target.value)} required />
        </div>
        <div className="col-md-6 mb-3">
          <label htmlFor="email" className="form-label"><i className="bi bi-envelope me-1"></i> Email</label>
          <input type="email" className="form-control" id="email" value={email} onChange={e => onChange('email', e.target.value)} required />
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="bio" className="form-label"><i className="bi bi-info-circle me-1"></i> Bio</label>
        <textarea className="form-control" id="bio" rows="3" value={bio} onChange={e => onChange('bio', e.target.value)} maxLength={500} placeholder="Tell us about yourself..." />
        <div className="form-text">{bio.length}/500 characters</div>
      </div>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="location" className="form-label"><i className="bi bi-geo-alt me-1"></i> Location</label>
          <input type="text" className="form-control" id="location" value={location} onChange={e => onChange('location', e.target.value)} placeholder="City, Country" />
        </div>
        <div className="col-md-6 mb-3">
          <label htmlFor="website" className="form-label"><i className="bi bi-globe me-1"></i> Website</label>
          <input type="url" className="form-control" id="website" value={website} onChange={e => onChange('website', e.target.value)} placeholder="https://yourwebsite.com" />
        </div>
      </div>
      <div className="mb-3">
        <div className="row g-2">
          <div className="col-md-4">
            <label htmlFor="github" className="form-label"><i className="bi bi-github me-1"></i> GitHub</label>
            <input type="url" className="form-control" id="github" value={githubUrl} onChange={e => onChange('githubUrl', e.target.value)} placeholder="https://github.com/username" />
          </div>
          <div className="col-md-4">
            <label htmlFor="linkedin" className="form-label"><i className="bi bi-linkedin me-1"></i> LinkedIn</label>
            <input type="url" className="form-control" id="linkedin" value={linkedinUrl} onChange={e => onChange('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/username" />
          </div>
          <div className="col-md-4">
            <label htmlFor="twitter" className="form-label"><i className="bi bi-twitter me-1"></i> Twitter</label>
            <input type="url" className="form-control" id="twitter" value={twitterUrl} onChange={e => onChange('twitterUrl', e.target.value)} placeholder="https://twitter.com/username" />
          </div>
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="privacy" className="form-label"><i className="bi bi-shield-lock me-1"></i> Profile Privacy</label>
        <select className="form-select" id="privacy" value={profilePrivacy} onChange={e => onChange('profilePrivacy', e.target.value)}>
          <option value="public">Public - Anyone can view</option>
          <option value="friends">Friends - Only friends can view</option>
          <option value="private">Private - Only you can view</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary w-100 rounded-pill" disabled={isLoading}>
        {isLoading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
};

export default ProfileForm; 