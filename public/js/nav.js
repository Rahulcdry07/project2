function checkAdminLink() {
    const storedUserRole = localStorage.getItem('user_role');
    const adminPanelLink = document.getElementById('admin-panel-link');

    if (adminPanelLink && storedUserRole === 'admin') {
        adminPanelLink.style.display = 'inline-block';
    } else if (adminPanelLink) {
        adminPanelLink.style.display = 'none';
    }
}

// This function runs when the page is first loaded
function setupLogout() {
    const logoutButton = document.getElementById('logout-link');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                const result = await response.json();
                if (result.success) {
                    localStorage.clear();
                    window.location.href = 'login.html';
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
}

// This function runs when the page is first loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initial check
    checkAdminLink();
    setupLogout();

    // Run the check again after a tiny delay to catch updates from the login page
    setTimeout(() => {
        checkAdminLink();
        setupLogout();
    }, 50);

    // Also, listen for any future storage changes
    window.addEventListener('storage', checkAdminLink);
});
