import React, { useState, useEffect } from 'react';

function App() {
  const [username, setUsername] = useState('User');
  const [stats, setStats] = useState({
    total_users: 0,
    new_registrations_today: 0,
    online_users: 0,
  });
  const [currentPlan, setCurrentPlan] = useState('N/A');
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const storedUsername = localStorage.getItem('user_name');
    if (storedUsername) {
      setUsername(storedUsername);
    }

    const userRole = localStorage.getItem('user_role');

    async function fetchDashboardData() {
      try {
        // Fetch Dashboard Stats
        const statsResponse = await fetch('/api/dashboard-stats');
        const statsResult = await statsResponse.json();
        if (statsResult.success) {
          setStats(statsResult.stats);
        } else {
          console.error('Failed to load dashboard stats:', statsResult.message);
        }

        // If user is admin, set plan to "Admin" and skip plan fetch
        if (userRole === 'admin') {
          setCurrentPlan('Admin');
        } else {
          // Fetch Current Plan for non-admin users
          const planResponse = await fetch('/api/user-plan');
          const planResult = await planResponse.json();
          if (planResult.success && planResult.plan) {
            setCurrentPlan(planResult.plan.plan_name);
          } else {
            console.error('Failed to load current plan:', planResult.message);
            setCurrentPlan('N/A');
          }
        }

        // Fetch Recent Activities
        const activitiesResponse = await fetch('/api/recent-activities');
        const activitiesResult = await activitiesResponse.json();
        if (activitiesResult.success) {
          setActivities(activitiesResult.activities);
        } else {
          console.error('Failed to load recent activities:', activitiesResult.message);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <>
      <nav className="main-nav">
        <div className="nav-container">
          <a href="dashboard.html" className="nav-brand">SecureReg</a>
          <div className="nav-links">
            <a href="profile.html">Profile</a>
            <a href="pricing.html">Pricing</a>
            <a href="admin.html" id="admin-panel-link" style={{ display: 'none' }}>Admin</a>
            <a href="#" id="logout-link">Logout</a>
          </div>
        </div>
      </nav>

      <div className="dashboard-page-container">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>Welcome Back, <span id="dashboard-username">{username}</span>!</h1>
            <p>Here's a snapshot of your account activity and site statistics.</p>
          </div>
        </header>

        <main className="dashboard-main">
          <section className="stats-grid">
            <div className="stat-card users">
              <div className="stat-icon"><i className="fas fa-users"></i></div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p id="total-users">{stats.total_users}</p>
              </div>
            </div>
            <div className="stat-card new-users">
              <div className="stat-icon"><i className="fas fa-user-plus"></i></div>
              <div className="stat-info">
                <h3>New Users Today</h3>
                <p id="new-registrations-today">{stats.new_registrations_today}</p>
              </div>
            </div>
            <div className="stat-card plan">
              <div className="stat-icon"><i className="fas fa-gem"></i></div>
              <div className="stat-info">
                <h3>Current Plan</h3>
                <p id="current-plan">{currentPlan}</p>
              </div>
            </div>
            <div className="stat-card online-users">
              <div className="stat-icon"><i className="fas fa-globe"></i></div>
              <div className="stat-info">
                <h3>Online Users</h3>
                <p id="online-users">{stats.online_users}</p>
              </div>
            </div>
          </section>

          <section className="recent-activity-table">
            <div className="table-header">
              <h2>Recent Activity</h2>
              <a href="#" className="view-all-link">View All</a>
            </div>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Date</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody id="activity-list">
                {activities.map((activity, index) => (
                  <tr key={index}>
                    <td>{activity.name || activity.email}</td>
                    <td>{activity.description}</td>
                    <td>{new Date(activity.created_at).toLocaleString()}</td>
                    <td>{activity.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </>
  );
}

export default App;