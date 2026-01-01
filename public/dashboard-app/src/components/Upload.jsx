import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './common/Toast';
import { API_URL } from '../services/api';

const Upload = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [recentUploads, setRecentUploads] = useState([]);
  const [converting, setConverting] = useState({});
  const [convertedResults, setConvertedResults] = useState({});
  const [calculatingCost, setCalculatingCost] = useState({});
  const [costEstimates, setCostEstimates] = useState({});

  // Load saved uploads from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('uploadedFiles');
    const savedResults = localStorage.getItem('convertedResults');
    const savedEstimates = localStorage.getItem('costEstimates');
    if (saved) {
      try {
        setRecentUploads(JSON.parse(saved));
      } catch (e) {
        // Silently fail - corrupted localStorage data
      }
    }
    if (savedResults) {
      try {
        setConvertedResults(JSON.parse(savedResults));
      } catch (e) {
        // Silently fail - corrupted localStorage data
      }
    }
    if (savedEstimates) {
      try {
        setCostEstimates(JSON.parse(savedEstimates));
      } catch (e) {
        // Silently fail - corrupted localStorage data
      }
    }
  }, []);

  // Save uploads to localStorage whenever they change
  useEffect(() => {
    if (recentUploads.length > 0) {
      // Store file metadata without the File object
      const filesData = recentUploads.map(f => ({
        name: f.name,
        size: f.size,
        uploadedAt: f.uploadedAt,
        isPDF: f.isPDF,
      }));
      localStorage.setItem('uploadedFiles', JSON.stringify(filesData));
    }
  }, [recentUploads]);

  // Save conversion results to localStorage
  useEffect(() => {
    if (Object.keys(convertedResults).length > 0) {
      localStorage.setItem('convertedResults', JSON.stringify(convertedResults));
    }
  }, [convertedResults]);

  // Save cost estimates to localStorage
  useEffect(() => {
    if (Object.keys(costEstimates).length > 0) {
      localStorage.setItem('costEstimates', JSON.stringify(costEstimates));
    }
  }, [costEstimates]);

  const handleFileSelect = e => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDrop = e => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = e => {
    e.preventDefault();
  };

  const removeFile = index => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const deleteUploadedFile = index => {
    setRecentUploads(prev => {
      const newUploads = prev.filter((_, i) => i !== index);
      if (newUploads.length === 0) {
        localStorage.removeItem('uploadedFiles');
      }
      return newUploads;
    });

    // Remove conversion result for this file
    setConvertedResults(prev => {
      const newResults = { ...prev };
      delete newResults[index];

      // Reindex remaining results
      const reindexed = {};
      Object.keys(newResults).forEach(key => {
        const oldIndex = parseInt(key);
        const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
        reindexed[newIndex] = newResults[key];
      });

      if (Object.keys(reindexed).length === 0) {
        localStorage.removeItem('convertedResults');
      }
      return reindexed;
    });

    // Remove cost estimate for this file
    setCostEstimates(prev => {
      const newEstimates = { ...prev };
      delete newEstimates[index];

      // Reindex remaining estimates
      const reindexed = {};
      Object.keys(newEstimates).forEach(key => {
        const oldIndex = parseInt(key);
        const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
        reindexed[newIndex] = newEstimates[key];
      });

      if (Object.keys(reindexed).length === 0) {
        localStorage.removeItem('costEstimates');
      }
      return reindexed;
    });

    showSuccess('File removed');
  };

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showError('Please select files to upload');
      return;
    }

    setUploading(true);

    try {
      // Upload each file to the server
      const uploadedFiles = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));

        const formData = new FormData();
        formData.append('file', file);

        // Simulate upload progress (in real scenario, use XMLHttpRequest for progress)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [i]: Math.min((prev[i] || 0) + 10, 90),
          }));
        }, 100);

        try {
          // TODO: Replace with actual upload endpoint when available
          // For now, we'll store the file reference
          await new Promise(resolve => setTimeout(resolve, 1000));

          clearInterval(progressInterval);
          setUploadProgress(prev => ({ ...prev, [i]: 100 }));

          uploadedFiles.push({
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            isPDF: file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'),
            fileData: file, // Store actual File object temporarily for conversion
          });
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      }

      // Add to recent uploads (at the beginning)
      setRecentUploads(prev => [...uploadedFiles, ...prev]);

      showSuccess(`Successfully uploaded ${selectedFiles.length} file(s)`);
      setSelectedFiles([]);
      setUploadProgress({});
    } catch (error) {
      showError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleConvertPDF = async (file, index) => {
    // Check if we have the actual file data
    if (!file.fileData) {
      showError('File not available. Please upload the file again to convert it.');
      return;
    }

    setConverting(prev => ({ ...prev, [index]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file.fileData);
      formData.append('includeMetadata', 'true');
      formData.append('extractTables', 'true');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/pdf/convert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.status === 401) {
        showError('Session expired. Please log in again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/index.html';
        }, 2000);
        return;
      }

      if (result.success) {
        showSuccess(`PDF converted successfully: ${file.name}`);
        setConvertedResults(prev => ({
          ...prev,
          [index]: {
            data: result.data.data, // Nested data from API response
            totalPages: result.data.totalPages,
            jsonFilename: result.data.jsonFilename,
          },
        }));
      } else {
        showError(result.message || 'PDF conversion failed');
      }
    } catch (error) {
      showError(`Conversion failed: ${error.message}`);
    } finally {
      setConverting(prev => ({ ...prev, [index]: false }));
    }
  };

  const downloadJSON = (result, filename) => {
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.pdf', '.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCalculateCost = async index => {
    const result = convertedResults[index];
    if (!result) {
      showError('Please convert the PDF first');
      return;
    }

    setCalculatingCost(prev => ({ ...prev, [index]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/dsr/estimate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfData: result.data }),
      });

      const estimateResult = await response.json();

      if (response.status === 401) {
        showError('Session expired. Please log in again.');
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/index.html';
        }, 2000);
        return;
      }

      if (estimateResult.success) {
        showSuccess('Cost estimation completed');
        setCostEstimates(prev => ({
          ...prev,
          [index]: estimateResult.data,
        }));
      } else {
        showError(estimateResult.message || 'Cost estimation failed');
      }
    } catch (error) {
      showError(`Cost estimation failed: ${error.message}`);
    } finally {
      setCalculatingCost(prev => ({ ...prev, [index]: false }));
    }
  };

  const downloadCostEstimate = (estimate, filename) => {
    const blob = new Blob([JSON.stringify(estimate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.pdf', '-cost-estimate.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getFileIcon = filename => {
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
                  onKeyDown={e =>
                    e.key === 'Enter' && document.getElementById('file-input').click()
                  }
                  role="button"
                  tabIndex={0}
                  aria-label="Upload files area"
                >
                  <i
                    className="bi bi-cloud-upload"
                    style={{ fontSize: '4rem', color: '#6c757d' }}
                  ></i>
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
                  <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                    {uploading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
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
                        <div className="d-flex align-items-start">
                          <i className={`bi ${getFileIcon(file.name)} fs-4 me-2`}></i>
                          <div className="flex-grow-1">
                            <div className="fw-semibold small">{file.name}</div>
                            <small className="text-muted">
                              {formatFileSize(file.size)} •{' '}
                              {new Date(file.uploadedAt).toLocaleTimeString()}
                            </small>

                            {/* PDF Conversion Section */}
                            {file.isPDF && (
                              <div className="mt-2">
                                {!convertedResults[index] ? (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleConvertPDF(file, index)}
                                    disabled={converting[index] || !file.fileData}
                                  >
                                    {converting[index] ? (
                                      <>
                                        <span
                                          className="spinner-border spinner-border-sm me-1"
                                          role="status"
                                        ></span>
                                        Converting...
                                      </>
                                    ) : !file.fileData ? (
                                      <>
                                        <i className="bi bi-exclamation-circle me-1"></i>
                                        Re-upload to Convert
                                      </>
                                    ) : (
                                      <>
                                        <i className="bi bi-file-earmark-code me-1"></i>
                                        Convert to JSON
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <div>
                                    <div className="alert alert-success py-1 px-2 mt-1 mb-1">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <small>
                                          <i className="bi bi-check-circle me-1"></i>
                                          Converted ({convertedResults[index].totalPages} pages)
                                        </small>
                                        <button
                                          className="btn btn-sm btn-success"
                                          onClick={() =>
                                            downloadJSON(convertedResults[index], file.name)
                                          }
                                        >
                                          <i className="bi bi-download me-1"></i>
                                          Download JSON
                                        </button>
                                      </div>
                                    </div>

                                    {/* Cost Estimation Section */}
                                    {!costEstimates[index] ? (
                                      <button
                                        className="btn btn-sm btn-outline-info mt-1"
                                        onClick={() => handleCalculateCost(index)}
                                        disabled={calculatingCost[index]}
                                      >
                                        {calculatingCost[index] ? (
                                          <>
                                            <span
                                              className="spinner-border spinner-border-sm me-1"
                                              role="status"
                                            ></span>
                                            Calculating...
                                          </>
                                        ) : (
                                          <>
                                            <i className="bi bi-calculator me-1"></i>
                                            Calculate Costs
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <div className="alert alert-info py-2 px-2 mt-1 mb-0">
                                        <div className="d-flex justify-content-between align-items-start">
                                          <div className="small">
                                            <i className="bi bi-calculator me-1"></i>
                                            <strong>Cost Estimate:</strong>
                                            <div className="mt-1">
                                              <div>
                                                Total:{' '}
                                                {formatCurrency(
                                                  costEstimates[index].cost_estimate?.total_cost ||
                                                    0
                                                )}
                                              </div>
                                              <div
                                                className="text-muted"
                                                style={{ fontSize: '0.75rem' }}
                                              >
                                                Matched:{' '}
                                                {costEstimates[index].cost_estimate
                                                  ?.matched_items || 0}{' '}
                                                items
                                                {costEstimates[index].cost_estimate
                                                  ?.unmatched_items > 0 &&
                                                  ` • Unmatched: ${costEstimates[index].cost_estimate.unmatched_items}`}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="d-flex gap-1">
                                            {costEstimates[index].report_link && (
                                              <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() =>
                                                  window.open(
                                                    `dsr-report.html?id=${costEstimates[index].report_id}`,
                                                    '_blank'
                                                  )
                                                }
                                                title="View detailed report"
                                              >
                                                <i className="bi bi-eye"></i>
                                              </button>
                                            )}
                                            <button
                                              className="btn btn-sm btn-info"
                                              onClick={() =>
                                                downloadCostEstimate(
                                                  costEstimates[index],
                                                  file.name
                                                )
                                              }
                                              title="Download cost estimate"
                                            >
                                              <i className="bi bi-download"></i>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            className="btn btn-sm btn-link text-danger p-0 ms-2"
                            onClick={() => deleteUploadedFile(index)}
                            title="Delete file"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
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
