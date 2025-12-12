import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './common/Toast';

const Upload = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [recentUploads, setRecentUploads] = useState([]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select files to upload');
      return;
    }

    setUploading(true);

    try {
      // Simulate upload for each file
      const uploadedFiles = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        // Update progress
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setUploadProgress(prev => ({ ...prev, [i]: progress }));
        }
        
        // Add to uploaded files
        uploadedFiles.push({
          name: selectedFiles[i].name,
          size: selectedFiles[i].size,
          uploadedAt: new Date()
        });
      }

      // Add to recent uploads
      setRecentUploads(prev => [...uploadedFiles, ...prev].slice(0, 5));
      
      showSuccess(`Successfully uploaded ${selectedFiles.length} file(s)`);
      setSelectedFiles([]);
      setUploadProgress({});
    } catch (error) {
      showError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
      pdf: 'bi-file-pdf text-danger',
      doc: 'bi-file-word text-primary',
      docx: 'bi-file-word text-primary',
      xls: 'bi-file-excel text-success',
      xlsx: 'bi-file-excel text-success',
      ppt: 'bi-file-ppt text-warning',
      pptx: 'bi-file-ppt text-warning',
      jpg: 'bi-file-image text-info',
      jpeg: 'bi-file-image text-info',
      png: 'bi-file-image text-info',
      gif: 'bi-file-image text-info',
      zip: 'bi-file-zip text-secondary',
      txt: 'bi-file-text text-muted',
    };
    return iconMap[ext] || 'bi-file-earmark text-secondary';
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-right" />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Upload Files</h1>
        </div>

        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-body">
                <div
                  className="border border-2 border-dashed rounded p-5 text-center"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  style={{ cursor: 'pointer', backgroundColor: '#f8f9fa' }}
                  onClick={() => document.getElementById('file-input').click()}
                  onKeyDown={(e) => e.key === 'Enter' && document.getElementById('file-input').click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload files area"
                >
                  <i className="bi bi-cloud-upload" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
                  <h5 className="mt-3">Drag & Drop files here</h5>
                  <p className="text-muted">or click to browse</p>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Selected Files ({selectedFiles.length})</h5>
                  <button
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-upload me-2"></i>
                        Upload All
                      </>
                    )}
                  </button>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="list-group-item">
                        <div className="d-flex align-items-start">
                          <div className="me-3">
                            <i className={`bi ${getFileIcon(file.name)} fs-2`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-1">{file.name}</h6>
                                <small className="text-muted">{formatFileSize(file.size)}</small>
                              </div>
                              {!uploading && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => removeFile(index)}
                                >
                                  <i className="bi bi-x-lg"></i>
                                </button>
                              )}
                            </div>
                            {uploadProgress[index] !== undefined && (
                              <div className="progress mt-2" style={{ height: '5px' }}>
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{ width: `${uploadProgress[index]}%` }}
                                  aria-valuenow={uploadProgress[index]}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                ></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Upload Guidelines</h5>
              </div>
              <div className="card-body">
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Maximum file size: 100MB
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Multiple files supported
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Drag & drop enabled
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Supported formats: PDF, DOC, XLS, PPT, Images, ZIP
                  </li>
                </ul>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h5 className="mb-0">Recent Uploads</h5>
              </div>
              <div className="card-body">
                {recentUploads.length === 0 ? (
                  <p className="text-muted text-center py-3">No recent uploads</p>
                ) : (
                  <div className="list-group list-group-flush">
                    {recentUploads.map((file, index) => (
                      <div key={index} className="list-group-item px-0">
                        <div className="d-flex align-items-center">
                          <i className={`bi ${getFileIcon(file.name)} fs-4 me-2`}></i>
                          <div className="flex-grow-1">
                            <div className="fw-semibold small">{file.name}</div>
                            <small className="text-muted">
                              {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleTimeString()}
                            </small>
                          </div>
                          <i className="bi bi-check-circle-fill text-success"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Upload;
