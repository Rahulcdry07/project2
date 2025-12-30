import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, isAdmin } from '../utils/auth';
import { tenderAPI } from '../services/api';
import { LoadingSpinner, Alert } from './common/FormComponents';
import PageHeader from './common/PageHeader';
import StatCard from './common/StatCard';
import EmptyState from './common/EmptyState';

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
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const upcomingDeadlines = [...recentTenders]
      .sort((a, b) => new Date(a.submission_deadline) - new Date(b.submission_deadline))
      .slice(0, 4);

    const focusAreas = [
      {
        label: 'Complete profile information',
        detail: 'Strengthen trust with complete company docs',
        action: '/profile'
      },
      {
        label: 'Review recommendations',
        detail: '3 new matches added in the last hour',
        action: '/recommendations'
      },
      {
        label: 'Check tender FAQs',
        detail: 'Updated compliance requirements this week',
        action: '/tenders'
      }
    ];

    const renderActions = (
      <>
        <Link to="/tenders" className="btn btn-light">
          <i className="bi bi-search me-2"></i>
          Browse Tenders
        </Link>
        <Link to="/recommendations" className="btn btn-outline-primary">
          <i className="bi bi-stars me-2"></i>
          Personalized Feed
        </Link>
        {isAdmin() && (
          <Link to="/admin/tenders" className="btn btn-outline-secondary">
            <i className="bi bi-gear me-2"></i>
            Admin Console
          </Link>
        )}
      </>
    );

    if (loading) {
      return (
        <div className="page-container">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      );
    }

    return (
      <div className="page-container">
        <PageHeader 
          title={user ? `Welcome back, ${user.username}` : 'Dashboard'}
          subtitle="Track open opportunities, deadlines, and quick actions in one place."
          actions={renderActions}
        />

        {error && <Alert type="danger" message={error} />}

        <section className="page-section">
          <div className="stat-grid">
            <StatCard
              icon="bi-collection"
              label="Total Tenders"
              value={userStats.totalTenders}
              trendLabel="All opportunities tracked"
            />
            <StatCard
              icon="bi-lightning-charge"
              label="Active Tenders"
              value={userStats.activeTenders}
              trendLabel="Updated hourly"
              trendDirection="up"
              variant="success"
            />
            <StatCard
              icon="bi-alarm"
              label="Closing Soon"
              value={userStats.closingSoon}
              trendLabel="Due within 7 days"
              trendDirection="down"
              variant="warning"
            />
          </div>
        </section>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="panel-card">
              <div className="panel-card__header">
                <div className="panel-card__title">
                  <i className="bi bi-clock-history"></i>
                  Recent Active Tenders
                </div>
                <Link to="/tenders" className="btn btn-sm btn-outline-primary">
                  View All
                </Link>
              </div>
              {recentTenders.length === 0 ? (
                <EmptyState
                  title="No active tenders yet"
                  description="Once new tenders match your filters, they will appear here automatically."
                  action={(
                    <Link to="/tenders" className="btn btn-primary">
                      <i className="bi bi-search me-2"></i>
                      Browse Tenders
                    </Link>
                  )}
                />
              ) : (
                <div className="recent-list">
                  {recentTenders.map((tender) => {
                    const daysLeft = getDaysLeft(tender.submission_deadline);
                    const badgeClass = daysLeft <= 7 ? 'warning' : 'safe';

                    return (
                      <div key={tender.id} className="recent-list__item">
                        <div>
                          <Link to={`/tenders/${tender.id}`} className="fw-semibold text-decoration-none">
                            {tender.title}
                          </Link>
                          <div className="recent-list__meta mt-1">
                            <span className="me-3">
                              <i className="bi bi-building me-1"></i>
                              {tender.organization}
                            </span>
                            <span>
                              <i className="bi bi-geo-alt me-1"></i>
                              {tender.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={`badge-deadline ${badgeClass}`}>
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Closed'}
                          </span>
                          <div className="recent-list__meta mt-2">
                            Due {formatDate(tender.submission_deadline)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="col-lg-4">
            <div className="panel-card mb-4">
              <div className="panel-card__header">
                <div className="panel-card__title">
                  <i className="bi bi-calendar-event"></i>
                  Upcoming deadlines
                </div>
              </div>
              {upcomingDeadlines.length === 0 ? (
                <EmptyState
                  icon="bi-calendar4-week"
                  title="No deadlines this week"
                  description="You are on track. We will surface the next batch of reminders here."
                />
              ) : (
                <div className="timeline">
                  {upcomingDeadlines.map((tender) => (
                    <div key={tender.id} className="timeline__item">
                      <div className="timeline__bullet">
                        <i className="bi bi-hourglass"></i>
                      </div>
                      <div className="timeline__content">
                        <h6 className="fw-semibold mb-1">{tender.title}</h6>
                        <p>{formatDate(tender.submission_deadline)} · {getDaysLeft(tender.submission_deadline)} days left</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel-card">
              <div className="panel-card__header">
                <div className="panel-card__title">
                  <i className="bi bi-check2-circle"></i>
                  Focus for today
                </div>
              </div>
              <div className="reminder-list">
                {focusAreas.map((item) => (
                  <div key={item.label} className="reminder-card">
                    <strong>{item.label}</strong>
                    <small className="text-muted d-block mb-2">{item.detail}</small>
                    <Link to={item.action} className="btn btn-sm btn-outline-primary">
                      Go now
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="panel-card h-100">
              <div className="panel-card__header">
                <div className="panel-card__title">
                  <i className="bi bi-lightning"></i>
                  Quick actions
                </div>
              </div>
              <div className="quick-actions">
                <Link to="/recommendations" className="btn btn-outline-success">
                  <i className="bi bi-stars"></i>
                  Personalized recommendations
                </Link>
                <Link to="/tenders" className="btn btn-outline-primary">
                  <i className="bi bi-search"></i>
                  Search tenders
                </Link>
                <Link to="/tenders?status=Active" className="btn btn-outline-secondary">
                  <i className="bi bi-list-check"></i>
                  Active tenders
                </Link>
                <Link to="/profile" className="btn btn-outline-info">
                  <i className="bi bi-person"></i>
                  Update profile
                </Link>
                {isAdmin() && (
                  <Link to="/admin/tenders" className="btn btn-outline-warning">
                    <i className="bi bi-plus-circle"></i>
                    Create tender
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="panel-card h-100">
              <div className="panel-card__header">
                <div className="panel-card__title">
                  <i className="bi bi-tags"></i>
                  Browse by category
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {[
                  { name: 'Construction', icon: 'building' },
                  { name: 'IT Services', icon: 'laptop' },
                  { name: 'Healthcare', icon: 'heart-pulse' },
                  { name: 'Education', icon: 'book' },
                  { name: 'Engineering', icon: 'gear' },
                  { name: 'Other', icon: 'three-dots' }
                ].map((category) => (
                  <Link
                    key={category.name}
                    to={`/tenders?category=${encodeURIComponent(category.name)}`}
                    className="tag-pill"
                  >
                    <i className={`bi bi-${category.icon}`}></i>
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="panel-card h-100">
              <div className="panel-card__header">
                <div className="panel-card__title">
                  <i className="bi bi-lightbulb"></i>
                  Tips for success
                </div>
              </div>
              <div className="row g-3">
                <div className="col-12">
                  <h6 className="mb-2">📋 Application tips</h6>
                  <ul className="small mb-0">
                    <li>Read requirements carefully</li>
                    <li>Submit before deadline</li>
                    <li>Prepare all documents</li>
                  </ul>
                </div>
                <div className="col-12">
                  <h6 className="mb-2">🔍 Search smarter</h6>
                  <ul className="small mb-0">
                    <li>Use relevant keywords</li>
                    <li>Filter by location & value</li>
                    <li>Save frequent filters</li>
                  </ul>
                </div>
                <div className="col-12">
                  <h6 className="mb-2">⚡ Stay proactive</h6>
                  <ul className="small mb-0">
                    <li>Enable email reminders</li>
                    <li>Check dashboard daily</li>
                    <li>Bookmark reference docs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;