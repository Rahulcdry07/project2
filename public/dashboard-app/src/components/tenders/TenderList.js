/**
 * TenderList component - Main page for browsing tenders
 * Similar to TenderDetail.com homepage with search and filtering
 */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { tenderAPI } from '../../services/api';
import { LoadingSpinner, Alert } from '../common/FormComponents';

const TenderCard = ({ tender }) => {
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
            month: 'short',
            day: 'numeric'
        });
    };

    const getDaysLeft = (deadline) => {
        const today = new Date();
        const deadlineDate = new Date(deadline);
        const diffTime = deadlineDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysLeft = getDaysLeft(tender.submission_deadline);
    const isUrgent = daysLeft <= 7;
    const isExpired = daysLeft < 0;

    return (
        <div className="card mb-3 h-100">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title text-primary">{tender.title}</h5>
                    {tender.is_featured && (
                        <span className="badge bg-warning text-dark">Featured</span>
                    )}
                </div>
                
                <div className="row mb-2">
                    <div className="col-sm-6">
                        <small className="text-muted">Organization:</small>
                        <div className="fw-semibold">{tender.organization}</div>
                    </div>
                    <div className="col-sm-6">
                        <small className="text-muted">Reference:</small>
                        <div className="fw-semibold">{tender.reference_number}</div>
                    </div>
                </div>

                <p className="card-text text-muted">
                    {tender.description.length > 150 
                        ? tender.description.substring(0, 150) + '...'
                        : tender.description
                    }
                </p>

                <div className="row mb-2">
                    <div className="col-sm-6">
                        <small className="text-muted">Category:</small>
                        <div>
                            <span className="badge bg-secondary">{tender.category}</span>
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <small className="text-muted">Location:</small>
                        <div className="fw-semibold">{tender.location}</div>
                    </div>
                </div>

                <div className="row mb-3">
                    <div className="col-sm-6">
                        <small className="text-muted">Estimated Value:</small>
                        <div className="fw-semibold text-success">
                            {formatCurrency(tender.estimated_value, tender.currency)}
                        </div>
                    </div>
                    <div className="col-sm-6">
                        <small className="text-muted">Deadline:</small>
                        <div className={`fw-semibold ${isExpired ? 'text-danger' : isUrgent ? 'text-warning' : 'text-info'}`}>
                            {formatDate(tender.submission_deadline)}
                            {!isExpired && (
                                <small className="d-block">
                                    ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)
                                </small>
                            )}
                            {isExpired && (
                                <small className="d-block text-danger">Expired</small>
                            )}
                        </div>
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center">
                    <span className={`badge ${tender.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {tender.status}
                    </span>
                    <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => window.location.href = `/tenders/${tender.id}`}
                    >
                        View Details
                    </button>
                </div>
            </div>
        </div>
    );
};

TenderCard.propTypes = {
    tender: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        organization: PropTypes.string.isRequired,
        reference_number: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        location: PropTypes.string.isRequired,
        estimated_value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        currency: PropTypes.string,
        submission_deadline: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        is_featured: PropTypes.bool
    }).isRequired
};

const TenderList = () => {
    const [tenders, setTenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        location: '',
        status: 'Active',
        q: ''
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    const categories = [
        'Construction', 'IT Services', 'Consulting', 'Supplies', 
        'Transportation', 'Healthcare', 'Education', 'Engineering', 
        'Maintenance', 'Other'
    ];

    const locations = [
        'New York', 'California', 'Texas', 'Florida', 'Illinois', 
        'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'
    ];

    const fetchTenders = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            
            // Clean up empty filters
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([, value]) => value !== '')
            );
            
            const response = await tenderAPI.getTenders({
                ...cleanFilters,
                page,
                pageSize
            });
            const paginationMeta = response.pagination || { total: response.tenders?.length || 0, totalPages: 1 };
            if (paginationMeta.totalPages && paginationMeta.totalPages > 0 && page > paginationMeta.totalPages) {
                setPage(paginationMeta.totalPages);
                return;
            }
            setTenders(response.tenders || []);
            setPagination(paginationMeta);
        } catch (err) {
            setError(err.message || 'Failed to fetch tenders');
        } finally {
            setLoading(false);
        }
    }, [filters, page, pageSize]);

    useEffect(() => {
        fetchTenders();
    }, [fetchTenders]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({
            category: '',
            location: '',
            status: 'Active',
            q: ''
        });
        setPage(1);
    };

    const handlePageSizeChange = (event) => {
        setPageSize(Number(event.target.value));
        setPage(1);
    };

    const goToPreviousPage = () => {
        setPage(prev => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setPage(prev => {
            const totalPages = pagination.totalPages || 1;
            return Math.min(prev + 1, totalPages);
        });
    };

    const totalTenders = pagination.total ?? tenders.length;
    const totalPages = pagination.totalPages || 1;
    const startItem = totalTenders === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = totalTenders === 0 ? 0 : Math.min(page * pageSize, totalTenders);
    const pageSizeOptions = [6, 9, 12, 24];

    if (loading) {
        return <LoadingSpinner message="Loading tenders..." />;
    }

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <h1 className="h2 mb-3">Government & Private Tenders</h1>
                    <p className="text-muted lead">
                        Find and bid on tenders from government agencies and private organizations. 
                        Filter by category, location, and value to find opportunities that match your business.
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title mb-3">Search & Filter Tenders</h5>
                            
                            <div className="row g-3">
                                {/* Search */}
                                <div className="col-md-6">
                                    <label htmlFor="search-input" className="form-label">Search</label>
                                    <input
                                        id="search-input"
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by title, description, or organization..."
                                        value={filters.q}
                                        onChange={(e) => handleFilterChange('q', e.target.value)}
                                    />
                                </div>

                                {/* Status */}
                                <div className="col-md-2">
                                    <label htmlFor="status-select" className="form-label">Status</label>
                                    <select
                                        id="status-select"
                                        className="form-select"
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Active">Active</option>
                                        <option value="Closed">Closed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Category */}
                                <div className="col-md-2">
                                    <label htmlFor="category-select" className="form-label">Category</label>
                                    <select
                                        id="category-select"
                                        className="form-select"
                                        value={filters.category}
                                        onChange={(e) => handleFilterChange('category', e.target.value)}
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Location */}
                                <div className="col-md-2">
                                    <label htmlFor="location-select" className="form-label">Location</label>
                                    <select
                                        id="location-select"
                                        className="form-select"
                                        value={filters.location}
                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                    >
                                        <option value="">All Locations</option>
                                        {locations.map(location => (
                                            <option key={location} value={location}>
                                                {location}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="row mt-3">
                                <div className="col-12">
                                    <button
                                        className="btn btn-outline-secondary me-2"
                                        onClick={clearFilters}
                                    >
                                        Clear Filters
                                    </button>
                                    <span className="text-muted">
                                        {totalTenders} tender{totalTenders !== 1 ? 's' : ''} found
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination controls */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                            <div>
                                <div className="fw-semibold">Results</div>
                                <small className="text-muted">
                                    {totalTenders === 0
                                        ? 'No tenders match the current filters.'
                                        : `Showing ${startItem}-${endItem} of ${totalTenders}`}
                                </small>
                            </div>
                            <div className="d-flex flex-column flex-md-row align-items-md-center gap-3">
                                <div>
                                    <label htmlFor="page-size-select" className="form-label mb-0 me-2">Per page</label>
                                    <select
                                        id="page-size-select"
                                        className="form-select d-inline-block w-auto"
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                    >
                                        {pageSizeOptions.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="btn-group" role="group" aria-label="Pagination controls">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={goToPreviousPage}
                                        disabled={page === 1 || totalTenders === 0}
                                    >
                                        Previous
                                    </button>
                                    <span className="btn btn-outline-secondary disabled">
                                        Page {totalTenders === 0 ? 0 : page} of {totalTenders === 0 ? 0 : totalPages}
                                    </span>
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={goToNextPage}
                                        disabled={page === totalPages || totalTenders === 0}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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

            {/* Tender Results */}
            <div className="row">
                {tenders.length === 0 ? (
                    <div className="col-12">
                        <div className="text-center py-5">
                            <i className="bi bi-search fs-1 text-muted"></i>
                            <h3 className="mt-3 text-muted">No tenders found</h3>
                            <p className="text-muted">
                                Try adjusting your search criteria or clearing the filters.
                            </p>
                        </div>
                    </div>
                ) : (
                    tenders.map(tender => (
                        <div key={tender.id} className="col-lg-6 col-xl-4 mb-4">
                            <TenderCard tender={tender} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TenderList;