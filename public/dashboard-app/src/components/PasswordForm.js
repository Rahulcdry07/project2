import React from 'react';

const PasswordForm = ({ oldPassword, newPassword, confirmNewPassword, onChange, onSubmit, isLoading, message }) => {
  return (
    <form onSubmit={onSubmit} className="glassy-card p-4 rounded-4 shadow mb-4">
      <h4 className="mb-3">Change Password</h4>
      {message && message.startsWith('Error:') && <div className="alert alert-danger" role="alert">{message}</div>}
      {message && !message.startsWith('Error:') && <div className="alert alert-success" role="alert">{message}</div>}
      <div className="mb-3">
        <label htmlFor="oldPassword" className="form-label">Old Password</label>
        <input type="password" className="form-control" id="oldPassword" value={oldPassword} onChange={e => onChange('oldPassword', e.target.value)} required />
      </div>
      <div className="mb-3">
        <label htmlFor="newPassword" className="form-label">New Password</label>
        <input type="password" className="form-control" id="newPassword" value={newPassword} onChange={e => onChange('newPassword', e.target.value)} required />
        <div className="form-text">
          <small>Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)</small>
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="confirmNewPassword" className="form-label">Confirm New Password</label>
        <input type="password" className="form-control" id="confirmNewPassword" value={confirmNewPassword} onChange={e => onChange('confirmNewPassword', e.target.value)} required />
      </div>
      <button type="submit" className="btn btn-primary w-100 rounded-pill" disabled={isLoading}>
        {isLoading ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
};

export default PasswordForm; 