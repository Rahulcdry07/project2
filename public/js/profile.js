document.addEventListener('DOMContentLoaded', async () => {
    const profileForm = document.getElementById('profile-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const message = document.getElementById('message');
    const token = localStorage.getItem('token');
    if (!token) window.location.href = 'login.html';

    // Fetch and display user profile
    try {
        const response = await fetch('/api/profile', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const user = await response.json();
        if (response.ok) {
            usernameInput.value = user.username;
            emailInput.value = user.email;
        } else if( user.error === 'Token expired.' ) {
            message.textContent = `Error: ${user.error}`;
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }

    // Handle profile update
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const email = emailInput.value;

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ username, email }),
            });

            const result = await response.json();

            if (response.ok) {
                message.textContent = 'Profile updated successfully!';
            } else if (result.error === 'Token expired.') {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
            } else {
                message.textContent = `Error: ${result.error}`;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            window.location.href = 'login.html';
        }
    });
});