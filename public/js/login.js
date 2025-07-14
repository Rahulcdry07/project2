document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok) {
            // In a real app, you would store the session/token from the server
            alert(result.message);
            localStorage.setItem('token', result.token); // Save the JWT
            window.location.href = result.redirect || '/dashboard.html';
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error logging in:', error);
    }
});
