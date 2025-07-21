import React, { useState, useEffect } from 'react';
import TokenManager from '../utils/tokenManager';

const EmailManager = () => {
    const [emailStats, setEmailStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        // Get user role
        const fetchUserRole = async () => {
            try {
                const response = await TokenManager.makeAuthenticatedRequest('/api/profile');
                const data = await response.json();
                if (response.ok) {
                    setUserRole(data.role);
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        };
        fetchUserRole();
    }, []);

    const testEmailService = async () => {
        setLoading(true);
        setMessage('');
        
        try {
            const response = await TokenManager.makeAuthenticatedRequest('/api/email/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(`✅ ${result.message}`);
            } else {
                setMessage(`❌ ${result.error}`);
            }
        } catch (error) {
            setMessage('❌ Network error testing email service.');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmailStats = async () => {
        setLoading(true);
        
        try {
            const response = await TokenManager.makeAuthenticatedRequest('/api/email/stats');
            const data = await response.json();
            
            if (response.ok) {
                setEmailStats(data);
            } else {
                setMessage(`❌ ${data.error}`);
            }
        } catch (error) {
            setMessage('❌ Network error fetching email stats.');
        } finally {
            setLoading(false);
        }
    };

    const sendWeeklySummary = async () => {
        if (!window.confirm('Are you sure you want to send weekly summaries to all verified users?')) {
            return;
        }

        setLoading(true);
        setMessage('');
        
        try {
            const response = await TokenManager.makeAuthenticatedRequest('/api/email/weekly-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(`✅ ${result.message}`);
                // Refresh stats
                fetchEmailStats();
            } else {
                setMessage(`❌ ${result.error}`);
            }
        } catch (error) {
            setMessage('❌ Network error sending weekly summaries.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-md-8 mx-auto">
                    <div className="card shadow-sm">
                        <div className="card-header">
                            <h3 className="card-title mb-0">
                                <i className="bi bi-envelope"></i> Email Management
                            </h3>
                        </div>
                        <div className="card-body">
                            {message && (
                                <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} role="alert">
                                    {message}
                                </div>
                            )}

                            {/* Email Service Test */}
                            <div className="mb-4">
                                <h5>Test Email Service</h5>
                                <p className="text-muted">Send a test email to verify the email service is working correctly.</p>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={testEmailService}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send"></i> Test Email Service
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Admin Features */}
                            {userRole === 'admin' && (
                                <>
                                    <hr />
                                    
                                    {/* Email Statistics */}
                                    <div className="mb-4">
                                        <h5>Email Statistics</h5>
                                        <p className="text-muted">View email service statistics and performance metrics.</p>
                                        <button 
                                            className="btn btn-info me-2" 
                                            onClick={fetchEmailStats}
                                            disabled={loading}
                                        >
                                            <i className="bi bi-graph-up"></i> Get Stats
                                        </button>
                                        
                                        {emailStats && (
                                            <div className="mt-3">
                                                <div className="row">
                                                    <div className="col-md-3">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h4 className="text-primary">{emailStats.totalSent || 0}</h4>
                                                                <p className="text-muted mb-0">Total Sent</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h4 className="text-danger">{emailStats.totalFailed || 0}</h4>
                                                                <p className="text-muted mb-0">Failed</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h4 className="text-success">{emailStats.successRate || 100}%</h4>
                                                                <p className="text-muted mb-0">Success Rate</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h4 className="text-info">{emailStats.templates?.length || 0}</h4>
                                                                <p className="text-muted mb-0">Templates</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {emailStats.templates && (
                                                    <div className="mt-3">
                                                        <h6>Available Templates:</h6>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {emailStats.templates.map((template, index) => (
                                                                <span key={index} className="badge bg-secondary">{template}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Weekly Summary */}
                                    <div className="mb-4">
                                        <h5>Weekly Summary</h5>
                                        <p className="text-muted">Send weekly activity summaries to all verified users.</p>
                                        <button 
                                            className="btn btn-warning" 
                                            onClick={sendWeeklySummary}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-calendar-week"></i> Send Weekly Summaries
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Email Templates Info */}
                            <hr />
                            <div>
                                <h5>Email Templates</h5>
                                <p className="text-muted">The system includes the following email templates:</p>
                                <div className="row">
                                    <div className="col-md-6">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item">
                                                <i className="bi bi-envelope-check text-success"></i> Welcome Email
                                            </li>
                                            <li className="list-group-item">
                                                <i className="bi bi-shield-check text-primary"></i> Email Verification
                                            </li>
                                            <li className="list-group-item">
                                                <i className="bi bi-key text-warning"></i> Password Reset
                                            </li>
                                            <li className="list-group-item">
                                                <i className="bi bi-lock text-danger"></i> Password Changed
                                            </li>
                                            <li className="list-group-item">
                                                <i className="bi bi-person text-info"></i> Profile Updated
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="col-md-6">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item">
                                                <i className="bi bi-camera text-success"></i> Profile Picture Updated
                                            </li>
                                            <li className="list-group-item">
                                                <i className="bi bi-device-hdd text-warning"></i> New Device Login
                                            </li>
                                            <li className="list-group-item">
                                                <i className="bi bi-exclamation-triangle text-danger"></i> Security Alert
                                            </li>
                                            <li className="list-group-item">
                                                <i className="bi bi-graph-up text-primary"></i> Weekly Summary
                                            </li>
                                            <li className="list-group-item">
                                                <i className="bi bi-person-plus text-info"></i> Admin New User
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailManager; 