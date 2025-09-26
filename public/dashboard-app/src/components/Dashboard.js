import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../utils/auth';

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  return (
    <div className="container mt-4">
      <h1>Dashboard</h1>
      {user && (
        <p>Welcome to your dashboard, {user.username}!</p>
      )}
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Quick Actions</h5>
              <p className="card-text">
                Access your most used features quickly.
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Recent Activity</h5>
              <p className="card-text">
                No recent activity to show.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;