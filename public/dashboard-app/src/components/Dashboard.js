import React, { useEffect, useState } from 'react';
import { getCurrentUser, isAdmin } from '../utils/auth';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      fetchFiles();
      fetchMetrics();
    }
  }, []);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    setLoading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setFiles([...files, data.file]);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(0), 2000);
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setFiles(files.filter(file => file.id !== fileId));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleFileDownload = async (fileId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/${fileId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const filteredFiles = files.filter(file => 
    file.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.originalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid mt-4">
      <div className="row mb-4">
        <div className="col">
          <h1 className="mb-3">
            <i className="bi bi-speedometer2 me-2"></i>
            Dashboard
          </h1>
          {user && (
            <div className="alert alert-info">
              <i className="bi bi-person-circle me-2"></i>
              Welcome back, <strong>{user.username || user.email}</strong>! 
              {isAdmin() && <span className="badge bg-warning text-dark ms-2">Admin</span>}
            </div>
          )}
        </div>
      </div>

      {/* System Status Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">System Status</h5>
                  <h2>{metrics?.status === 'ok' ? '✓' : '✗'}</h2>
                  <small>{metrics?.status === 'ok' ? 'Online' : 'Offline'}</small>
                </div>
                <i className="bi bi-server fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">My Files</h5>
                  <h2>{files.length}</h2>
                  <small>Total uploads</small>
                </div>
                <i className="bi bi-files fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Database</h5>
                  <h2>{metrics?.database === 'connected' ? '✓' : '✗'}</h2>
                  <small>{metrics?.database === 'connected' ? 'Connected' : 'Disconnected'}</small>
                </div>
                <i className="bi bi-database fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="card-title">Environment</h5>
                  <h2>DEV</h2>
                  <small>{metrics?.environment || 'development'}</small>
                </div>
                <i className="bi bi-gear fs-1 opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-lightning-charge-fill me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-2">
                  <button 
                    className="btn btn-primary w-100 mb-2"
                    onClick={() => document.getElementById('fileInput').click()}
                    disabled={loading}
                  >
                    <i className="bi bi-cloud-upload me-1"></i>
                    Upload File
                  </button>
                </div>
                <div className="col-md-2">
                  <a href="/profile" className="btn btn-outline-primary w-100 mb-2">
                    <i className="bi bi-person-gear me-1"></i>
                    Profile Settings
                  </a>
                </div>
                <div className="col-md-2">
                  <button 
                    className="btn btn-outline-success w-100 mb-2"
                    onClick={() => window.open('/api/metrics', '_blank')}
                  >
                    <i className="bi bi-graph-up me-1"></i>
                    View Metrics
                  </button>
                </div>
                <div className="col-md-2">
                  <button 
                    className="btn btn-outline-info w-100 mb-2"
                    onClick={() => window.open('/api-docs', '_blank')}
                  >
                    <i className="bi bi-book me-1"></i>
                    API Docs
                  </button>
                </div>
                {isAdmin() && (
                  <div className="col-md-2">
                    <a href="/admin" className="btn btn-outline-danger w-100 mb-2">
                      <i className="bi bi-shield-lock me-1"></i>
                      Admin Panel
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        id="fileInput"
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
      />

      {/* Upload Progress */}
      {uploadProgress > 0 && (
        <div className="mb-3">
          <div className="progress">
            <div 
              className="progress-bar bg-success" 
              style={{ width: `${uploadProgress}%` }}
              aria-valuenow={uploadProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {uploadProgress}%
            </div>
          </div>
        </div>
      )}

      {/* File Management */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-folder2-open me-2"></i>
                File Management
              </h5>
              <div className="input-group" style={{ width: '300px' }}>
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="card-body">
              {filteredFiles.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-file-earmark-x fs-1"></i>
                  <p className="mt-3">No files found. Upload your first file to get started!</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Size</th>
                        <th>Type</th>
                        <th>Uploaded</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map(file => (
                        <tr key={file.id}>
                          <td>
                            <i className="bi bi-file-earmark me-2"></i>
                            {file.originalName || file.filename}
                          </td>
                          <td>{file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'N/A'}</td>
                          <td>
                            <span className="badge bg-secondary">
                              {file.mimetype || file.type || 'Unknown'}
                            </span>
                          </td>
                          <td>{file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleFileDownload(file.id, file.originalName || file.filename)}
                            >
                              <i className="bi bi-download"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleFileDelete(file.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Recent Activity
              </h5>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <div className="list-group-item d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">System Status Check</h6>
                    <p className="mb-1 text-muted">All services are running normally</p>
                    <small className="text-success">✓ Healthy</small>
                  </div>
                  <small>{new Date().toLocaleTimeString()}</small>
                </div>
                {files.length > 0 && (
                  <div className="list-group-item d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">File Upload</h6>
                      <p className="mb-1 text-muted">Latest file: {files[files.length - 1]?.originalName}</p>
                      <small className="text-info">📁 File Management</small>
                    </div>
                    <small>Recent</small>
                  </div>
                )}
                <div className="list-group-item d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">Advanced Features Active</h6>
                    <p className="mb-1 text-muted">Image processing, security validation, performance monitoring</p>
                    <small className="text-warning">🔧 Enhanced</small>
                  </div>
                  <small>Active</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;