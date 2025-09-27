import React, { useState, useEffect } from 'react';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
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

  const handleFileUpload = async (event) => {
    const fileList = Array.from(event.target.files);
    if (fileList.length === 0) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const uploadPromises = fileList.map(async (file, index) => {
        const formData = new FormData();
        formData.append('document', file);

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        setUploadProgress(((index + 1) / fileList.length) * 100);
        
        if (response.ok) {
          return await response.json();
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      });

      const results = await Promise.all(uploadPromises);
      const newFiles = results.map(result => result.file);
      setFiles([...files, ...newFiles]);
      
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Some files failed to upload');
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

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    if (!confirm(`Delete ${selectedFiles.length} selected files?`)) return;

    const token = localStorage.getItem('token');
    const deletePromises = selectedFiles.map(fileId => 
      fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    );

    try {
      await Promise.all(deletePromises);
      setFiles(files.filter(file => !selectedFiles.includes(file.id)));
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };

  const handleFileDownload = async (fileId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/${fileId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
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

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const selectAllFiles = () => {
    setSelectedFiles(
      selectedFiles.length === filteredFiles.length 
        ? [] 
        : filteredFiles.map(file => file.id)
    );
  };

  return (
    <div className="container-fluid mt-4">
      <div className="row mb-4">
        <div className="col">
          <h1>
            <i className="bi bi-folder2-open me-2"></i>
            File Manager
          </h1>
          <p className="text-muted">Manage your uploaded documents with advanced features</p>
        </div>
      </div>

      {/* Upload and Actions */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-4">
                  <input
                    type="file"
                    id="fileUpload"
                    className="form-control"
                    onChange={handleFileUpload}
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                    disabled={loading}
                  />
                </div>
                <div className="col-md-4">
                  <div className="input-group">
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
                <div className="col-md-4">
                  {selectedFiles.length > 0 && (
                    <button 
                      className="btn btn-danger"
                      onClick={handleBulkDelete}
                    >
                      <i className="bi bi-trash me-1"></i>
                      Delete Selected ({selectedFiles.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-light">
            <div className="card-body text-center">
              <h3>{files.length}</h3>
              <small className="text-muted">Total Files</small>
              <hr />
              <small>
                <strong>Supported:</strong> PDF, DOC, TXT, Images<br />
                <strong>Max Size:</strong> 10MB per file
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress > 0 && (
        <div className="row mb-3">
          <div className="col-12">
            <div className="progress">
              <div 
                className="progress-bar bg-success progress-bar-striped progress-bar-animated" 
                style={{ width: `${uploadProgress}%` }}
              >
                Uploading... {Math.round(uploadProgress)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Files Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Your Files</h5>
              <div className="form-check">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="selectAll"
                  checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                  onChange={selectAllFiles}
                />
                <label className="form-check-label" htmlFor="selectAll">
                  Select All
                </label>
              </div>
            </div>
            <div className="card-body p-0">
              {filteredFiles.length === 0 ? (
                <div className="text-center p-5">
                  <i className="bi bi-file-earmark-x fs-1 text-muted"></i>
                  <p className="mt-3 text-muted">
                    {searchTerm ? 'No files match your search' : 'No files uploaded yet'}
                  </p>
                  {!searchTerm && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => document.getElementById('fileUpload').click()}
                    >
                      <i className="bi bi-cloud-upload me-1"></i>
                      Upload Your First File
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{width: '50px'}}></th>
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
                            <div className="form-check">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                checked={selectedFiles.includes(file.id)}
                                onChange={() => toggleFileSelection(file.id)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-file-earmark me-2 text-primary"></i>
                              <div>
                                <div className="fw-bold">{file.originalName || file.filename}</div>
                                {file.description && (
                                  <small className="text-muted">{file.description}</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            {file.size ? (
                              <span className="badge bg-light text-dark">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {file.mimetype?.split('/')[1] || file.type || 'Unknown'}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : 'N/A'}
                            </small>
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleFileDownload(file.id, file.originalName || file.filename)}
                                title="Download"
                              >
                                <i className="bi bi-download"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-info"
                                title="View Details"
                                data-bs-toggle="modal"
                                data-bs-target={`#fileModal${file.id}`}
                              >
                                <i className="bi bi-info-circle"></i>
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleFileDelete(file.id)}
                                title="Delete"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
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
    </div>
  );
};

export default FileManager;