document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const statusDiv = document.getElementById('verification-status');

    if (!token) {
        statusDiv.innerHTML = '<h1><i class="fas fa-exclamation-circle"></i> Invalid Link</h1><p>The verification link is missing a token.</p>';
        return;
    }

    try {
        const response = await fetch('/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
        const result = await response.json();

        if (result.success) {
            statusDiv.innerHTML = '<h1><i class="fas fa-check-circle"></i> Email Verified!</h1><p>Your email address has been successfully verified. You can now log in.</p>';
        } else {
            statusDiv.innerHTML = `<h1><i class="fas fa-times-circle"></i> Verification Failed</h1><p>${result.message || 'An error occurred during verification.'}</p>`;
        }
    } catch (error) {
        console.error('Error during email verification:', error);
        statusDiv.innerHTML = '<h1><i class="fas fa-exclamation-triangle"></i> Network Error</h1><p>Could not connect to the server. Please try again later.</p>';
    }
});
