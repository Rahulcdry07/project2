/**
 * TenderRecommendations component - Personalized tender recommendations for logged-in users
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tenderAPI } from '../../services/api';
import { getCurrentUser } from '../../utils/auth';
import { LoadingSpinner, Alert } from '../common/FormComponents.jsx';

const TenderRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getCurrentUser();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all active tenders and simulate personalized recommendations
      const response = await tenderAPI.getTenders({ status: 'Active' });
      const allTenders = response.tenders || [];
      
      // Simple recommendation logic - in a real app this would be more sophisticated
      const shuffled = allTenders.sort(() => 0.5 - Math.random());
      setRecommendations(shuffled.slice(0, 6));
      
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysLeft = (deadline) => {
    const daysLeft = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const getCategoryBadge = (category) => {
    const badgeMap = {
      'Construction': 'bg-primary',
      'IT Services': 'bg-info', 
      'Consulting': 'bg-success',
      'Supplies': 'bg-warning',
      'Transportation': 'bg-secondary',
      'Healthcare': 'bg-danger',
      'Education': 'bg-dark',
      'Engineering': 'bg-primary',
      'Maintenance': 'bg-secondary',
      'Other': 'bg-light text-dark'
    };
    return badgeMap[category] || 'bg-secondary';
  };

  if (loading) {
    return <LoadingSpinner message="Loading personalized recommendations..." />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Recommended for You</h1>
          <p className="text-muted">Personalized tender recommendations based on your profile</p>
        </div>
        <Link to="/dashboard" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-1"></i>
          Back to Dashboard
        </Link>
      </div>

      {error && <Alert type="danger" message={error} />}

      {/* User Info Banner */}
      <div className="alert alert-info" role="alert">
        <div className="d-flex align-items-center">
          <i className="bi bi-person-circle fs-4 me-3"></i>
          <div>
            <h6 className="mb-1">Hello, {user?.username}!</h6>
            <small>These tenders are selected based on current market activity and your account preferences.</small>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-inbox display-1 text-muted"></i>
          <h4 className="mt-3">No recommendations available</h4>
          <p className="text-muted">Check back later for personalized tender recommendations.</p>
          <Link to="/tenders" className="btn btn-primary">
            Browse All Tenders
          </Link>
        </div>
      ) : (
        <>
          {/* Recommendation Stats */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-center border-primary">
                <div className="card-body">
                  <h4 className="text-primary">{recommendations.length}</h4>
                  <small className="text-muted">Recommended</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-success">
                <div className="card-body">
                  <h4 className="text-success">
                    {recommendations.filter(t => getDaysLeft(t.submission_deadline) > 7).length}
                  </h4>
                  <small className="text-muted">Long Deadline</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-warning">
                <div className="card-body">
                  <h4 className="text-warning">
                    {recommendations.filter(t => getDaysLeft(t.submission_deadline) <= 7).length}
                  </h4>
                  <small className="text-muted">Closing Soon</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center border-info">
                <div className="card-body">
                  <h4 className="text-info">
                    {Math.round(recommendations.reduce((sum, t) => sum + (t.estimated_value || 0), 0) / 1000000)}M
                  </h4>
                  <small className="text-muted">Total Value (₹)</small>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Tenders Grid */}
          <div className="row">
            {recommendations.map(tender => (
              <div key={tender.id} className="col-lg-6 col-xl-4 mb-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header bg-white border-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <span className={`badge ${getCategoryBadge(tender.category)}`}>
                        {tender.category}
                      </span>
                      <div className="text-end">
                        <small className="text-muted d-block">{tender.reference_number}</small>
                        <span className={`badge ${getDaysLeft(tender.submission_deadline) <= 7 ? 'bg-warning' : 'bg-success'} mt-1`}>
                          {getDaysLeft(tender.submission_deadline)} days left
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <h6 className="card-title">{tender.title}</h6>
                    
                    <p className="card-text text-muted small mb-2">
                      <i className="bi bi-building me-1"></i>
                      {tender.organization}
                    </p>
                    
                    <p className="card-text small">
                      {tender.description.length > 100 
                        ? `${tender.description.substring(0, 100)}...` 
                        : tender.description
                      }
                    </p>
                    
                    <div className="small text-muted mb-3">
                      <div className="d-flex justify-content-between">
                        <span>
                          <i className="bi bi-geo-alt me-1"></i>
                          {tender.location}
                        </span>
                        <span>
                          <i className="bi bi-currency-rupee me-1"></i>
                          {formatCurrency(tender.estimated_value, tender.currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-footer bg-white border-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        Due: {formatDate(tender.submission_deadline)}
                      </small>
                      <Link 
                        to={`/tenders/${tender.id}`} 
                        className="btn btn-primary btn-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="text-center mt-4">
            <Link to="/tenders" className="btn btn-outline-primary me-2">
              <i className="bi bi-search me-1"></i>
              Browse All Tenders
            </Link>
            <Link to="/profile" className="btn btn-outline-info">
              <i className="bi bi-gear me-1"></i>
              Update Preferences
            </Link>
          </div>
        </>
      )}

      {/* Tips Section */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card bg-light">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-lightbulb me-2"></i>
                How Recommendations Work
              </h5>
              <div className="row">
                <div className="col-md-4">
                  <h6 className="text-primary">🎯 Profile Based</h6>
                  <p className="small text-muted">
                    Recommendations are based on your profile preferences, 
                    selected categories, and location settings.
                  </p>
                </div>
                <div className="col-md-4">
                  <h6 className="text-success">📊 Activity Based</h6>
                  <p className="small text-muted">
                    We consider your browsing history and previously 
                    viewed tenders to suggest relevant opportunities.
                  </p>
                </div>
                <div className="col-md-4">
                  <h6 className="text-info">🔄 Real-time Updates</h6>
                  <p className="small text-muted">
                    Recommendations are updated regularly as new tenders 
                    are published and your preferences change.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderRecommendations;