document.addEventListener('DOMContentLoaded', () => {
    const adminPanelLink = document.getElementById('admin-panel-link');
    const logoutLink = document.getElementById('logout-link');

    // In a real app, you would have a more robust way of checking the user's role
    const userRole = 'admin'; // Placeholder

    if (adminPanelLink && userRole === 'admin') {
        adminPanelLink.style.display = 'inline-block';
    }

    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/logout', { method: 'POST' });
                // In a real app, you would clear the session/token here
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Error logging out:', error);
            }
        });
    }
});
