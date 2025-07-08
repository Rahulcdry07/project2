
document.addEventListener('DOMContentLoaded', () => {
    const usernameSpan = document.getElementById('dashboard-username');
    const userRoleSpan = document.getElementById('dashboard-user-role');
    const storedUsername = localStorage.getItem('user_name');
    const storedUserRole = localStorage.getItem('user_role');

    if (usernameSpan && storedUsername) {
        usernameSpan.textContent = storedUsername;
    }
    if (userRoleSpan && storedUserRole) {
        userRoleSpan.textContent = storedUserRole;
    }

    // Fetch and display dynamic statistics
    async function fetchDashboardStats() {
        try {
            const response = await fetch('/api/dashboard-stats');
            const result = await response.json();

            if (result.success) {
                document.getElementById('total-users').textContent = result.stats.total_users;
                document.getElementById('new-registrations-today').textContent = result.stats.new_registrations_today;
                document.getElementById('online-users').textContent = result.stats.online_users;
            } else {
                console.error('Failed to load dashboard stats:', result.message);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    }

    fetchDashboardStats(); // Call on page load

    // Fetch and display recent activities
    async function fetchRecentActivities() {
        try {
            const response = await fetch('/api/recent-activities');
            const result = await response.json();

            if (result.success) {
                const activityList = document.getElementById('activity-list');
                activityList.innerHTML = ''; // Clear existing activities
                result.activities.forEach(activity => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<i class="fas fa-info-circle"></i> ${activity.description} (User: ${activity.name || activity.email}) at ${new Date(activity.created_at).toLocaleString()}`; // Customize display
                    activityList.appendChild(listItem);
                });
            } else {
                console.error('Failed to load recent activities:', result.message);
            }
        } catch (error) {
            console.error('Error fetching recent activities:', error);
        }
    }

    fetchRecentActivities(); // Call on page load

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const result = await response.json();
                if (result.success) {
                    localStorage.clear(); // Clear all local storage items
                    window.location.href = 'login.html'; // Redirect to login page
                } else {
                    console.error('Logout failed:', result.message);
                    alert('Logout failed: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('Network error during logout.');
            }
        });
    }
});
