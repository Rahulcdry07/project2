import React, { useRef } from 'react';

const ProfilePicture = ({ profilePicture, onUpload, isUploading, onRemove }) => {
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="profile-picture-upload glassy-card text-center mb-4 p-3 rounded-4 shadow position-relative"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ width: 140, margin: '0 auto', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="position-relative d-inline-block">
        <img
          src={profilePicture || '/default-avatar.png'}
          alt="Profile"
          className="rounded-circle border border-2 shadow"
          style={{ width: 100, height: 100, objectFit: 'cover', background: '#fff', transition: 'box-shadow 0.2s' }}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-danger position-absolute top-0 end-0 rounded-circle"
          style={{ zIndex: 2, width: 28, height: 28, padding: 0, display: profilePicture ? 'block' : 'none' }}
          onClick={onRemove}
          title="Remove picture"
        >
          <i className="bi bi-x-lg"></i>
        </button>
        <label htmlFor="profile-picture-input" className="btn btn-sm btn-outline-primary position-absolute bottom-0 end-0 rounded-circle" style={{ zIndex: 2, width: 32, height: 32, padding: 0 }}>
          <i className="bi bi-camera"></i>
        </label>
        <input
          type="file"
          id="profile-picture-input"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
      </div>
      <div className="mt-2 text-muted small">
        {isUploading ? 'Uploading...' : 'Drag & drop or click camera to upload'}
      </div>
    </div>
  );
};

export default ProfilePicture; 