/**
 * TenderManagement component - Admin interface for managing tenders
 * Create, edit, delete tenders
 */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { tenderAPI } from '../../services/api';
import { LoadingSpinner, Alert } from '../common/FormComponents';

const TenderForm = ({ tender, onSubmit, onCancel, loading }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        reference_number: '',
        organization: '',
        category: 'Other',
        location: '',
        estimated_value: '',
        currency: 'USD',
        submission_deadline: '',
        published_date: new Date().toISOString().split('T')[0],
        status: 'Active',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        requirements: '',
        eligibility_criteria: '',
        evaluation_criteria: '',
        is_featured: false,
        ...tender
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (tender) {
            setFormData(prevFormData => ({
                ...prevFormData,
                ...tender,
                submission_deadline: tender.submission_deadline ? 
                    new Date(tender.submission_deadline).toISOString().slice(0, 16) : '',
                published_date: tender.published_date ? 
                    new Date(tender.published_date).toISOString().split('T')[0] : ''
            }));
        }
    }, [tender]);

    const categories = [
        'Construction', 'IT Services', 'Consulting', 'Supplies', 
        'Transportation', 'Healthcare', 'Education', 'Engineering', 
        'Maintenance', 'Other'
    ];

    const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title?.trim()) newErrors.title = 'Title is required';
        if (!formData.description?.trim()) newErrors.description = 'Description is required';
        if (!formData.reference_number?.trim()) newErrors.reference_number = 'Reference number is required';
        if (!formData.organization?.trim()) newErrors.organization = 'Organization is required';
        if (!formData.location?.trim()) newErrors.location = 'Location is required';
        if (!formData.submission_deadline) newErrors.submission_deadline = 'Submission deadline is required';
        
        if (formData.submission_deadline && new Date(formData.submission_deadline) <= new Date()) {
            newErrors.submission_deadline = 'Submission deadline must be in the future';
        }

        if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
            newErrors.contact_email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="row">
                {/* Basic Information */}
                <div className="col-lg-8">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Basic Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-8 mb-3">
                                    <label htmlFor="tender-title" className="form-label">Title *</label>
                                    <input
                                        id="tender-title"
                                        type="text"
                                        className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Enter tender title"
                                    />
                                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                                </div>
                                
                                <div className="col-md-4 mb-3">
                                    <label htmlFor="tender-ref" className="form-label">Reference Number *</label>
                                    <input
                                        id="tender-ref"
                                        type="text"
                                        className={`form-control ${errors.reference_number ? 'is-invalid' : ''}`}
                                        name="reference_number"
                                        value={formData.reference_number}
                                        onChange={handleChange}
                                        placeholder="REF-2024-001"
                                    />
                                    {errors.reference_number && <div className="invalid-feedback">{errors.reference_number}</div>}
                                </div>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="tender-description" className="form-label">Description *</label>
                                <textarea
                                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                    name="description"
                                    rows="4"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Provide a detailed description of the tender"
                                />
                                {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Organization *</label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.organization ? 'is-invalid' : ''}`}
                                        name="organization"
                                        value={formData.organization}
                                        onChange={handleChange}
                                        placeholder="Organization name"
                                    />
                                    {errors.organization && <div className="invalid-feedback">{errors.organization}</div>}
                                </div>
                                
                                <div className="col-md-3 mb-3">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-select"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="col-md-3 mb-3">
                                    <label className="form-label">Location *</label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.location ? 'is-invalid' : ''}`}
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="City, State"
                                    />
                                    {errors.location && <div className="invalid-feedback">{errors.location}</div>}
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Estimated Value</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="estimated_value"
                                        value={formData.estimated_value}
                                        onChange={handleChange}
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                    />
                                </div>
                                
                                <div className="col-md-2 mb-3">
                                    <label className="form-label">Currency</label>
                                    <select
                                        className="form-select"
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                    >
                                        {currencies.map(currency => (
                                            <option key={currency} value={currency}>
                                                {currency}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="col-md-3 mb-3">
                                    <label className="form-label">Submission Deadline *</label>
                                    <input
                                        type="datetime-local"
                                        className={`form-control ${errors.submission_deadline ? 'is-invalid' : ''}`}
                                        name="submission_deadline"
                                        value={formData.submission_deadline}
                                        onChange={handleChange}
                                    />
                                    {errors.submission_deadline && <div className="invalid-feedback">{errors.submission_deadline}</div>}
                                </div>
                                
                                <div className="col-md-3 mb-3">
                                    <label className="form-label">Published Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="published_date"
                                        value={formData.published_date}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Requirements and Criteria */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Requirements & Criteria</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Requirements</label>
                                <textarea
                                    className="form-control"
                                    name="requirements"
                                    rows="3"
                                    value={formData.requirements}
                                    onChange={handleChange}
                                    placeholder="Specify requirements for bidders"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Eligibility Criteria</label>
                                <textarea
                                    className="form-control"
                                    name="eligibility_criteria"
                                    rows="3"
                                    value={formData.eligibility_criteria}
                                    onChange={handleChange}
                                    placeholder="Specify eligibility criteria"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Evaluation Criteria</label>
                                <textarea
                                    className="form-control"
                                    name="evaluation_criteria"
                                    rows="3"
                                    value={formData.evaluation_criteria}
                                    onChange={handleChange}
                                    placeholder="How proposals will be evaluated"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="col-lg-4">
                    {/* Status and Settings */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Status & Settings</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Active">Active</option>
                                    <option value="Closed">Closed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="is_featured"
                                    checked={formData.is_featured}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label">
                                    Featured Tender
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Contact Information</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Contact Person</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="contact_person"
                                    value={formData.contact_person}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Contact Email</label>
                                <input
                                    type="email"
                                    className={`form-control ${errors.contact_email ? 'is-invalid' : ''}`}
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleChange}
                                    placeholder="contact@example.com"
                                />
                                {errors.contact_email && <div className="invalid-feedback">{errors.contact_email}</div>}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Contact Phone</label>
                                <input
                                    type="tel"
                                    className="form-control"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="card">
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        tender ? 'Update Tender' : 'Create Tender'
                                    )}
                                </button>
                                
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary"
                                    onClick={onCancel}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

TenderForm.propTypes = {
    tender: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

const TenderManagement = () => {
    const [tenders, setTenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTender, setEditingTender] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchTenders();
    }, []);

    const fetchTenders = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await tenderAPI.getTenders();
            setTenders(response.tenders || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch tenders');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTender = async (tenderData) => {
        try {
            setFormLoading(true);
            await tenderAPI.createTender(tenderData);
            setShowForm(false);
            fetchTenders();
        } catch (err) {
            setError(err.message || 'Failed to create tender');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateTender = async (tenderData) => {
        try {
            setFormLoading(true);
            await tenderAPI.updateTender(editingTender.id, tenderData);
            setShowForm(false);
            setEditingTender(null);
            fetchTenders();
        } catch (err) {
            setError(err.message || 'Failed to update tender');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteTender = async (id) => {
        if (!window.confirm('Are you sure you want to delete this tender?')) {
            return;
        }

        try {
            await tenderAPI.deleteTender(id);
            fetchTenders();
        } catch (err) {
            setError(err.message || 'Failed to delete tender');
        }
    };

    const handleEdit = (tender) => {
        setEditingTender(tender);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingTender(null);
        setError('');
    };

    if (loading) {
        return <LoadingSpinner message="Loading tenders..." />;
    }

    if (showForm) {
        return (
            <div className="container-fluid">
                <div className="row mb-4">
                    <div className="col-12">
                        <h1 className="h3 mb-0">
                            {editingTender ? 'Edit Tender' : 'Create New Tender'}
                        </h1>
                    </div>
                </div>

                {error && (
                    <Alert 
                        type="danger" 
                        message={error}
                        onClose={() => setError('')}
                    />
                )}

                <TenderForm
                    tender={editingTender}
                    onSubmit={editingTender ? handleUpdateTender : handleCreateTender}
                    onCancel={handleCancel}
                    loading={formLoading}
                />
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-sm-6">
                    <h1 className="h3 mb-0">Tender Management</h1>
                    <p className="text-muted">Manage all tenders in the system</p>
                </div>
                <div className="col-sm-6 text-end">
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowForm(true)}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        Create New Tender
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <Alert 
                    type="danger" 
                    message={error}
                    onClose={() => setError('')}
                />
            )}

            {/* Tender List */}
            <div className="card">
                <div className="card-body">
                    {tenders.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-folder2-open fs-1 text-muted"></i>
                            <h3 className="mt-3 text-muted">No tenders found</h3>
                            <p className="text-muted">Get started by creating your first tender.</p>
                            <button 
                                className="btn btn-primary"
                                onClick={() => setShowForm(true)}
                            >
                                Create New Tender
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Reference</th>
                                        <th>Organization</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Deadline</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tenders.map(tender => (
                                        <tr key={tender.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    {tender.title}
                                                    {tender.is_featured && (
                                                        <span className="badge bg-warning text-dark ms-2">
                                                            Featured
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{tender.reference_number}</td>
                                            <td>{tender.organization}</td>
                                            <td>
                                                <span className="badge bg-secondary">
                                                    {tender.category}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    tender.status === 'Active' ? 'bg-success' :
                                                    tender.status === 'Draft' ? 'bg-warning text-dark' :
                                                    'bg-secondary'
                                                }`}>
                                                    {tender.status}
                                                </span>
                                            </td>
                                            <td>
                                                {new Date(tender.submission_deadline).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => window.open(`/tenders/${tender.id}`, '_blank')}
                                                        title="View"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => handleEdit(tender)}
                                                        title="Edit"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger"
                                                        onClick={() => handleDeleteTender(tender.id)}
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
    );
};

export default TenderManagement;