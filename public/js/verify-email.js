document.addEventListener('DOMContentLoaded', async () => {
    const message = document.getElementById('message');
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
        message.textContent = 'No verification token found.';
        return;
    }

    try {
        const response = await fetch('/api/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (response.ok) {
            message.textContent = result.message;
        } else {
            message.textContent = `Error: ${result.error}`;
        }
    } catch (error) {
        console.error('Error verifying email:', error);
        message.textContent = 'An error occurred while verifying your email.';
    }
});
