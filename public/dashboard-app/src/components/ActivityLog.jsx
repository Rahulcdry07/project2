import React, { useState, useEffect, useCallback } from 'react';
import { activityAPI } from '../services/api';

const ActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await activityAPI.getActivityLogs(page, 20);
      setActivities(data.activities || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      // Error handling - could be logged to error tracking service
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getActivityIcon = (action) => {
    const icons = {
      login: 'bi-box-arrow-in-right text-success',
      logout: 'bi-box-arrow-right text-muted',
      password_change: 'bi-key text-warning',
      profile_update: 'bi-person-check text-info',
      settings_update: 'bi-gear text-primary',
      email_change: 'bi-envelope text-info'
    };
    return icons[action] || 'bi-circle-fill text-secondary';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && page === 1) {
    return (
      <div className="container mt-4">
        <h1>Activity Log</h1>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Activity Log</h1>
          <p className="text-muted mb-0">View your account activity and security events</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {activities.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-activity" style={{ fontSize: '3rem', color: '#ccc' }}></i>
              <p className="text-muted mt-3">No activity found</p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {activities.map((activity) => (
                <div key={activity.id} className="list-group-item px-0">
                  <div className="d-flex align-items-start">
                    <div className="me-3 mt-1">
                      <i className={`bi ${getActivityIcon(activity.action)} fs-5`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{activity.description || activity.action}</h6>
                          {activity.ipAddress && (
                            <small className="text-muted">
                              <i className="bi bi-geo-alt me-1"></i>
                              IP: {activity.ipAddress}
                            </small>
                          )}
                        </div>
                        <small className="text-muted">{formatDate(activity.createdAt)}</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
