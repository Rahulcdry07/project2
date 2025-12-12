import React, { useEffect, useState } from 'react';
import { getCurrentUser, isAdmin } from '../utils/auth';
import { SkeletonCard, SkeletonStats } from './common/SkeletonLoader';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    accountAge: 0,
    profileCompleteness: 0,
    lastLogin: null,
    role: 'user'
  });

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      const currentUser = getCurrentUser();
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUser(currentUser);
      
      // Calculate stats
      if (currentUser) {
        const accountCreated = currentUser.createdAt ? new Date(currentUser.createdAt) : new Date();
        const daysSinceCreation = Math.floor((Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));
        
        // Profile completeness based on available fields
        let completeness = 40; // Base for having username and email
        if (currentUser.username && currentUser.username.length > 3) completeness += 20;
        if (currentUser.email && currentUser.email.includes('@')) completeness += 20;
        if (currentUser.emailVerified) completeness += 20;
        
        setStats({
          accountAge: daysSinceCreation,
          profileCompleteness: Math.min(completeness, 100),
          lastLogin: new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          role: isAdmin() ? 'Admin' : 'User'
        });
      }
      
      setLoading(false);
    };
    
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="mb-4">
          <div style={{
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'pulse 1.5s ease-in-out infinite',
            width: '200px',
            height: '32px',
            borderRadius: '4px',
            marginBottom: '16px',
          }} />
          <div style={{
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'pulse 1.5s ease-in-out infinite',
            width: '300px',
            height: '20px',
            borderRadius: '4px',
          }} />
        </div>
        <SkeletonStats count={4} />
        <div className="row mt-4">
          <div className="col-md-6 mb-3">
            <SkeletonCard lines={3} />
          </div>
          <div className="col-md-6 mb-3">
            <SkeletonCard lines={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="mb-4">
        <h1 className="mb-2">Dashboard</h1>
        {user && (
          <p className="text-muted">Welcome back, <strong>{user.username}</strong>!</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-primary text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 opacity-75">Account Age</h6>
                  <h3 className="card-title mb-0">{stats.accountAge} days</h3>
                </div>
                <i className="bi bi-calendar-check" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-success text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 opacity-75">Profile</h6>
                  <h3 className="card-title mb-0">{stats.profileCompleteness}%</h3>
                </div>
                <i className="bi bi-person-check" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
              </div>
              <div className="progress mt-2" style={{ height: '4px' }}>
                <div 
                  className="progress-bar bg-white" 
                  style={{ width: `${stats.profileCompleteness}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-info text-white h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 opacity-75">Last Login</h6>
                  <h6 className="card-title mb-0" style={{ fontSize: '0.95rem' }}>{stats.lastLogin}</h6>
                </div>
                <i className="bi bi-clock-history" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card bg-warning text-dark h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2 opacity-75">Account Role</h6>
                  <h3 className="card-title mb-0">{stats.role}</h3>
                </div>
                <i className="bi bi-shield-check" style={{ fontSize: '2rem', opacity: 0.4 }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-lightning-charge-fill text-primary me-2" style={{ fontSize: '1.5rem' }}></i>
                <h5 className="card-title mb-0">Quick Actions</h5>
              </div>
              <div className="list-group list-group-flush">
                <a href="/profile" className="list-group-item list-group-item-action border-0 px-0" aria-label="Update your profile">
                  <i className="bi bi-person-circle me-2" aria-hidden="true"></i>
                  Update your profile
                </a>
                {isAdmin() && (
                  <a href="/admin/users" className="list-group-item list-group-item-action border-0 px-0" aria-label="Manage users">
                    <i className="bi bi-people me-2" aria-hidden="true"></i>
                    Manage users
                  </a>
                )}
                <a href="/profile" className="list-group-item list-group-item-action border-0 px-0" aria-label="Account settings">
                  <i className="bi bi-gear me-2" aria-hidden="true"></i>
                  Account settings
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-activity text-success me-2" style={{ fontSize: '1.5rem' }}></i>
                <h5 className="card-title mb-0">Recent Activity</h5>
              </div>
              <div className="list-group list-group-flush">
                <div className="list-group-item border-0 px-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <span>Account login</span>
                    </div>
                    <small className="text-muted">Just now</small>
                  </div>
                </div>
                {user?.emailVerified && (
                  <div className="list-group-item border-0 px-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <i className="bi bi-envelope-check-fill text-info me-2"></i>
                        <span>Email verified</span>
                      </div>
                      <small className="text-muted">Verified</small>
                    </div>
                  </div>
                )}
                <div className="list-group-item border-0 px-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="bi bi-person-plus-fill text-primary me-2"></i>
                      <span>Account created</span>
                    </div>
                    <small className="text-muted">{stats.accountAge} days ago</small>
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

export default Dashboard;