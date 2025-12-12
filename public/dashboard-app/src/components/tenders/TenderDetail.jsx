/**
 * TenderDetail component - Detailed view of a single tender
 * Similar to individual tender pages on TenderDetail.com
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tenderAPI } from '../../services/api';
import { isAdmin, isAuthenticated } from '../../utils/auth';
import { LoadingSpinner, Alert } from '../common/FormComponents.jsx';

const TenderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tender, setTender] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTender = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await tenderAPI.getTender(id);
            setTender(response.tender);
        } catch (err) {
            setError(err.message || 'Failed to fetch tender details');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTender();
    }, [fetchTender]);

    const formatCurrency = (amount, currency) => {
        if (!amount) return 'Not specified';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDaysLeft = (deadline) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    if (loading) {
        return <LoadingSpinner message="Loading tender details..." />;
    }

    if (error) {
        return (
            <div className="container">
                <Alert 
                    type="danger" 
                    message={error}
                    onClose={() => navigate('/tenders')}
                />
            </div>
        );
    }

    if (!tender) {
        return (
            <div className="container">
                <Alert 
                    type="warning" 
                    message="Tender not found"
                    onClose={() => navigate('/tenders')}
                />
            </div>
        );
    }

    const daysLeft = getDaysLeft(tender.submission_deadline);
    const isUrgent = daysLeft <= 7;
    const isExpired = daysLeft < 0;

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <button 
                                    className="btn btn-link p-0"
                                    onClick={() => navigate('/tenders')}
                                >
                                    Tenders
                                </button>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                {tender.reference_number}
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div className="row">
                {/* Main Content */}
                <div className="col-lg-8">
                    {/* Title and Status */}
                    <div className="card mb-4">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h1 className="h3 mb-2">{tender.title}</h1>
                                    <p className="text-muted mb-0">
                                        Reference: <strong>{tender.reference_number}</strong>
                                    </p>
                                </div>
                                <div className="text-end">
                                    <span className={`badge fs-6 ${tender.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                        {tender.status}
                                    </span>
                                    {tender.is_featured && (
                                        <span className="badge bg-warning text-dark ms-2 fs-6">
                                            Featured
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Organization */}
                            <div className="row mb-3">
                                <div className="col-sm-3">
                                    <strong>Organization:</strong>
                                </div>
                                <div className="col-sm-9">
                                    {tender.organization}
                                </div>
                            </div>

                            {/* Deadline Alert */}
                            {!isExpired && isUrgent && (
                                <div className="alert alert-warning" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    <strong>Urgent!</strong> Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to submit.
                                </div>
                            )}

                            {isExpired && (
                                <div className="alert alert-danger" role="alert">
                                    <i className="bi bi-x-circle-fill me-2"></i>
                                    <strong>Expired!</strong> The submission deadline has passed.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Description</h5>
                        </div>
                        <div className="card-body">
                            <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
                                {tender.description}
                            </p>
                        </div>
                    </div>

                    {/* Requirements */}
                    {tender.requirements && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Requirements</h5>
                            </div>
                            <div className="card-body">
                                <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
                                    {tender.requirements}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Eligibility Criteria */}
                    {tender.eligibility_criteria && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Eligibility Criteria</h5>
                            </div>
                            <div className="card-body">
                                <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
                                    {tender.eligibility_criteria}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Evaluation Criteria */}
                    {tender.evaluation_criteria && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Evaluation Criteria</h5>
                            </div>
                            <div className="card-body">
                                <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
                                    {tender.evaluation_criteria}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Documents Required */}
                    {tender.documents_required && tender.documents_required.length > 0 && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Documents Required</h5>
                            </div>
                            <div className="card-body">
                                <ul className="list-unstyled">
                                    {tender.documents_required.map((doc, index) => (
                                        <li key={index} className="mb-1">
                                            <i className="bi bi-file-earmark-text me-2"></i>
                                            {doc}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                    {/* Key Information */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Key Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="row mb-2">
                                <div className="col-6">
                                    <small className="text-muted">Category</small>
                                    <div className="fw-semibold">{tender.category}</div>
                                </div>
                                <div className="col-6">
                                    <small className="text-muted">Location</small>
                                    <div className="fw-semibold">{tender.location}</div>
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-12">
                                    <small className="text-muted">Estimated Value</small>
                                    <div className="fw-semibold text-success fs-5">
                                        {formatCurrency(tender.estimated_value, tender.currency)}
                                    </div>
                                </div>
                            </div>

                            <hr />

                            <div className="row mb-2">
                                <div className="col-12">
                                    <small className="text-muted">Published Date</small>
                                    <div className="fw-semibold">{formatDate(tender.published_date)}</div>
                                </div>
                            </div>

                            <div className="row mb-2">
                                <div className="col-12">
                                    <small className="text-muted">Submission Deadline</small>
                                    <div className={`fw-semibold ${isExpired ? 'text-danger' : isUrgent ? 'text-warning' : 'text-success'}`}>
                                        {formatDateTime(tender.submission_deadline)}
                                    </div>
                                    {!isExpired && (
                                        <small className="text-muted">
                                            ({daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining)
                                        </small>
                                    )}
                                </div>
                            </div>

                            {/* Tags */}
                            {tender.tags && tender.tags.length > 0 && (
                                <>
                                    <hr />
                                    <div className="row">
                                        <div className="col-12">
                                            <small className="text-muted">Tags</small>
                                            <div className="mt-1">
                                                {tender.tags.map((tag, index) => (
                                                    <span key={index} className="badge bg-light text-dark me-1 mb-1">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    {(tender.contact_person || tender.contact_email || tender.contact_phone) && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5 className="mb-0">Contact Information</h5>
                            </div>
                            <div className="card-body">
                                {tender.contact_person && (
                                    <div className="mb-2">
                                        <small className="text-muted">Contact Person</small>
                                        <div className="fw-semibold">{tender.contact_person}</div>
                                    </div>
                                )}
                                
                                {tender.contact_email && (
                                    <div className="mb-2">
                                        <small className="text-muted">Email</small>
                                        <div className="fw-semibold">
                                            <a href={`mailto:${tender.contact_email}`} className="text-decoration-none">
                                                {tender.contact_email}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                
                                {tender.contact_phone && (
                                    <div className="mb-2">
                                        <small className="text-muted">Phone</small>
                                        <div className="fw-semibold">
                                            <a href={`tel:${tender.contact_phone}`} className="text-decoration-none">
                                                {tender.contact_phone}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="card">
                        <div className="card-body">
                            {!isExpired && tender.status === 'Active' && (
                                <div className="d-grid gap-2">
                                    <button 
                                        className="btn btn-success btn-lg"
                                        disabled={!isAuthenticated()}
                                        title={!isAuthenticated() ? 'Please login to submit application' : ''}
                                    >
                                        <i className="bi bi-file-earmark-plus me-2"></i>
                                        Submit Application
                                    </button>
                                    
                                    {!isAuthenticated() && (
                                        <small className="text-muted text-center">
                                            <a href="/login">Login</a> or <a href="/register">Register</a> to submit applications
                                        </small>
                                    )}
                                </div>
                            )}

                            {/* Admin Actions */}
                            {isAdmin() && (
                                <>
                                    <hr />
                                    <div className="d-grid gap-2">
                                        <button 
                                            className="btn btn-outline-primary"
                                            onClick={() => navigate(`/admin/tenders/${tender.id}/edit`)}
                                        >
                                            <i className="bi bi-pencil me-2"></i>
                                            Edit Tender
                                        </button>
                                    </div>
                                </>
                            )}

                            <hr />
                            <div className="text-center">
                                <small className="text-muted">
                                    Views: {tender.view_count || 0}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenderDetail;