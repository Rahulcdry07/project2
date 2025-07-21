import React from 'react';

const ProfileStatsCard = ({ loginCount, lastLogin, isVerified, profileUrl, onCopyLink }) => {
  return (
    <div className="card glassy-card mb-3 p-3 rounded-4 shadow border-0">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Account Statistics</h6>
        <span className={`badge ${isVerified ? 'bg-success' : 'bg-warning text-dark'}`}>{isVerified ? 'Verified' : 'Unverified'}</span>
      </div>
      <div className="row text-center mb-2">
        <div className="col-6">
          <div className="text-muted">Login Count</div>
          <div className="h5 mb-0">{loginCount}</div>
        </div>
        <div className="col-6">
          <div className="text-muted">Last Login</div>
          <div className="h6 mb-0">{lastLogin ? new Date(lastLogin).toLocaleDateString() : 'Never'}</div>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center mt-2">
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary rounded-pill px-3">
          View Public Profile
        </a>
        <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={onCopyLink} title="Copy profile link">
          <i className="bi bi-clipboard"></i> Copy Link
        </button>
      </div>
    </div>
  );
};

export default ProfileStatsCard; 