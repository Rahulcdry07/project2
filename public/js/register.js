document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const messageDiv = document.querySelector('.message');

    

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Client-side validation
        if (!name || !email || !password || !confirmPassword) {
            showMessage('All fields are required.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }

        const passwordValidation = isValidPassword(password);
        if (!passwordValidation.isValid) {
            showMessage(passwordValidation.message, 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match.', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);

            const response = await fetch('/register', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                let errorMessage = 'Registration failed. Please try again.';
                try {
                    const errorResult = await response.json();
                    console.error('Registration API error response:', errorResult);
                    if (errorResult.message) {
                        errorMessage = errorResult.message;
                    } else if (errorResult.errors) {
                        errorMessage = Object.values(errorResult.errors).join('\n');
                    }
                } catch (jsonError) {
                    console.error('Failed to parse error response JSON:', jsonError);
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                showMessage(errorMessage, 'error');
                return;
            }

            const result = await response.json();

            if (result.success) {
                showMessage(result.message, 'success');
                form.reset(); // Clear the form
                setTimeout(() => {
                    window.location.href = 'login.html'; // Redirect to login page
                }, 2000);
            } else {
                // This block handles cases where response.ok is true, but result.success is false
                // (e.g., custom application-level errors returned with 200 OK status)
                showMessage(result.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration network error:', error);
            showMessage('Network error. Please check your connection and try again.', 'error');
        }
    });
});