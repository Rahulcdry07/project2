document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const message = document.getElementById('message');

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const result = await response.json();
        message.textContent = result.message;
    } catch (error) {
        console.error('Error sending reset link:', error);
        message.textContent = 'An error occurred. Please try again.';
    }
});
