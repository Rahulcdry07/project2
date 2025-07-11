document.addEventListener('DOMContentLoaded', async () => {
    const profileForm = document.getElementById('profile-form');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const message = document.getElementById('message');

    // Fetch and display user profile
    try {
        const response = await fetch('/api/profile');
        const user = await response.json();
        if (response.ok) {
            usernameInput.value = user.username;
            emailInput.value = user.email;
        } else {
            message.textContent = `Error: ${user.error}`;
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
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
                },
                body: JSON.stringify({ username, email }),
            });

            const result = await response.json();

            if (response.ok) {
                message.textContent = 'Profile updated successfully!';
            } else {
                message.textContent = `Error: ${result.error}`;
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    });
});
