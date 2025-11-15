import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, isAdmin } from '../utils/auth';
import { tenderAPI } from '../services/api';
import { LoadingSpinner, Alert } from './common/FormComponents';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [recentTenders, setRecentTenders] = useState([]);
  const [userStats, setUserStats] = useState({
    totalTenders: 0,
    activeTenders: 0,
    closingSoon: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recent active tenders
      const response = await tenderAPI.getTenders({ 
        status: 'Active', 
        limit: 5 
      });
      setRecentTenders(response.tenders || []);
      
      // Calculate stats
      const allTendersResponse = await tenderAPI.getTenders();
      const allTenders = allTendersResponse.tenders || [];
      
      const activeTenders = allTenders.filter(t => t.status === 'Active').length;
      const closingSoon = allTenders.filter(t => {
        const daysLeft = Math.ceil((new Date(t.submission_deadline) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft > 0;
      }).length;
      
      setUserStats({
        totalTenders: allTenders.length,
        activeTenders,
        closingSoon
      });
      
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Dashboard</h1>
          {user && (
            <p className="text-muted">Welcome back, {user.username}!</p>
          )}
        </div>
        <div>
          <Link to="/tenders" className="btn btn-primary me-2">
            <i className="bi bi-search me-1"></i>
            Browse Tenders
          </Link>
          <Link to="/recommendations" className="btn btn-outline-primary me-2">
            <i className="bi bi-star me-1"></i>
            For You
          </Link>
          {isAdmin() && (
            <Link to="/admin/tenders" className="btn btn-outline-secondary">
              <i className="bi bi-gear me-1"></i>
              Manage Tenders
            </Link>
          )}
        </div>
      </div>

      {error && <Alert type="danger" message={error} />}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-center border-primary">
            <div className="card-body">
              <h2 className="text-primary">{userStats.totalTenders}</h2>
              <p className="card-text">Total Tenders</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center border-success">
            <div className="card-body">
              <h2 className="text-success">{userStats.activeTenders}</h2>
              <p className="card-text">Active Tenders</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center border-warning">
            <div className="card-body">
              <h2 className="text-warning">{userStats.closingSoon}</h2>
              <p className="card-text">Closing Soon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Recent Tenders */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Recent Active Tenders
              </h5>
              <Link to="/tenders" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </div>
            <div className="card-body">
              {recentTenders.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-inbox display-4 text-muted"></i>
                  <p className="text-muted mt-2">No recent tenders available</p>
                  <Link to="/tenders" className="btn btn-primary">
                    Browse Tenders
                  </Link>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentTenders.map(tender => (
                    <div key={tender.id} className="list-group-item border-0 px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">
                            <Link 
                              to={`/tenders/${tender.id}`} 
                              className="text-decoration-none"
                            >
                              {tender.title}
                            </Link>
                          </h6>
                          <p className="mb-1 text-muted small">
                            <i className="bi bi-building me-1"></i>
                            {tender.organization}
                          </p>
                          <small className="text-muted">
                            <i className="bi bi-geo-alt me-1"></i>
                            {tender.location}
                          </small>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${getDaysLeft(tender.submission_deadline) <= 7 ? 'bg-warning' : 'bg-success'}`}>
                            {getDaysLeft(tender.submission_deadline)} days left
                          </span>
                          <div className="small text-muted mt-1">
                            Due: {formatDate(tender.submission_deadline)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Info */}
        <div className="col-lg-4">
          <div className="card mb-3">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-lightning me-2"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <Link to="/recommendations" className="btn btn-outline-success">
                  <i className="bi bi-star me-2"></i>
                  Personalized Recommendations
                </Link>
                <Link to="/tenders" className="btn btn-outline-primary">
                  <i className="bi bi-search me-2"></i>
                  Search Tenders
                </Link>
                <Link to="/tenders?status=Active" className="btn btn-outline-success">
                  <i className="bi bi-list-check me-2"></i>
                  Active Tenders
                </Link>
                <Link to="/profile" className="btn btn-outline-info">
                  <i className="bi bi-person me-2"></i>
                  Update Profile
                </Link>
                {isAdmin() && (
                  <Link to="/admin/tenders" className="btn btn-outline-warning">
                    <i className="bi bi-plus-circle me-2"></i>
                    Create Tender
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Tender Categories */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-tags me-2"></i>
                Browse by Category
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-2">
                {[
                  { name: 'Construction', icon: 'building' },
                  { name: 'IT Services', icon: 'laptop' },
                  { name: 'Healthcare', icon: 'heart-pulse' },
                  { name: 'Education', icon: 'book' },
                  { name: 'Engineering', icon: 'gear' },
                  { name: 'Other', icon: 'three-dots' }
                ].map(category => (
                  <div key={category.name} className="col-6">
                    <Link 
                      to={`/tenders?category=${encodeURIComponent(category.name)}`}
                      className="btn btn-light btn-sm w-100 text-start"
                    >
                      <i className={`bi bi-${category.icon} me-1`}></i>
                      {category.name}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Helpful Tips */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card bg-light">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-lightbulb me-2"></i>
                Tips for Success
              </h5>
              <div className="row">
                <div className="col-md-4">
                  <h6>📋 Application Tips</h6>
                  <ul className="small">
                    <li>Read requirements carefully</li>
                    <li>Submit before deadline</li>
                    <li>Prepare all documents</li>
                  </ul>
                </div>
                <div className="col-md-4">
                  <h6>🔍 Search Tips</h6>
                  <ul className="small">
                    <li>Use relevant keywords</li>
                    <li>Filter by location</li>
                    <li>Check deadlines regularly</li>
                  </ul>
                </div>
                <div className="col-md-4">
                  <h6>⚡ Stay Updated</h6>
                  <ul className="small">
                    <li>Check dashboard daily</li>
                    <li>Set up notifications</li>
                    <li>Follow tender updates</li>
                  </ul>
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