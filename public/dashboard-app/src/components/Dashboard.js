import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Dashboard = () => {
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
    }, [isLoggedIn, authLoading, navigate]);

    if (authLoading) {
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <h1 className="mb-4">Welcome, {user?.username || 'User'}!</h1>
            <div className="row g-4 mb-4">
                {/* Profile Completion Widget */}
                <div className="col-md-4">
                    <div className="card glassy-card p-3 shadow rounded-4">
                        <h5>Profile Completion</h5>
                        <div className="progress mb-2" style={{ height: 8 }}>
                            <div className="progress-bar bg-info" role="progressbar" style={{ width: `${user?.profile_completion || 0}%` }}></div>
                        </div>
                        <div className="text-muted small">{user?.profile_completion || 0}% complete</div>
                    </div>
                </div>
                {/* Recent Logins Widget */}
                <div className="col-md-4">
                    <div className="card glassy-card p-3 shadow rounded-4">
                        <h5>Recent Logins</h5>
                        <div className="text-muted small">Last login: {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</div>
                        <div className="text-muted small">Total logins: {user?.login_count || 0}</div>
                    </div>
                </div>
                {/* Quick Links Widget */}
                <div className="col-md-4">
                    <div className="card glassy-card p-3 shadow rounded-4">
                        <h5>Quick Links</h5>
                        <ul className="list-unstyled mb-0">
                            <li><a href="/profile" className="text-primary">Edit Profile</a></li>
                            <li><a href="/" className="text-primary">Homepage</a></li>
                            {user?.role === 'admin' && <li><a href="/admin" className="text-danger">Admin Panel</a></li>}
                        </ul>
                    </div>
                </div>
            </div>
            {/* Placeholders for future widgets */}
            <div className="row g-4">
                <div className="col-md-6">
                    <div className="card glassy-card p-3 shadow rounded-4">
                        <h5>Activity Feed</h5>
                        <div className="text-muted small">Coming soon: Your recent activity will appear here.</div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card glassy-card p-3 shadow rounded-4">
                        <h5>Notifications</h5>
                        <div className="text-muted small">Coming soon: Notifications and alerts will appear here.</div>
                    </div>
                </div>
            </div>
            {user?.role === 'admin' && (
                <div className="row g-4 mt-4">
                    <div className="col-12">
                        <div className="card glassy-card p-3 shadow rounded-4">
                            <h5>Admin Stats</h5>
                            <div className="text-muted small">Coming soon: User stats, system health, and more for admins.</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
