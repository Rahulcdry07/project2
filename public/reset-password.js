document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const message = document.getElementById('message');
    const token = new URLSearchParams(window.location.search).get('token');

    if (password !== confirmPassword) {
        message.textContent = 'Passwords do not match.';
        return;
    }

    if (!token) {
        message.textContent = 'No reset token found.';
        return;
    }

    try {
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, password }),
        });

        const result = await response.json();

        if (response.ok) {
            message.textContent = result.message;
        } else {
            message.textContent = `Error: ${result.error}`;
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        message.textContent = 'An error occurred. Please try again.';
    }
});
