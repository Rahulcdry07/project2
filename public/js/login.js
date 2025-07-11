// login.js - Secure frontend implementation
let csrfToken = null;

// Fetch CSRF token on page load
async function fetchCSRFToken() {
    try {
        const response = await fetch('/csrf_token');
        const data = await response.json();
        csrfToken = data.token;
        console.log('CSRF token assigned in fetchCSRFToken:', csrfToken);
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        showMessage('Security token error. Please refresh the page.', 'error');
    }
}



// Handle form submission
    async function handleLogin(event) {
    console.log('CSRF token before form submission:', csrfToken);
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const loadingDiv = document.querySelector('.loading');
    
    // Get form data
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    
    // Clear previous messages
    showMessage('', 'info');
    
    // Client-side validation
    if (!email || !password) {
        showMessage('Please fill in all fields.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }
    
    // Show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Signing In...';
    if (loadingDiv) loadingDiv.style.display = 'block';
    
    try {
        // Prepare form data
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('csrf_token', csrfToken);
        
        // Submit login request
        const response = await fetch('/login', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            let errorMessage = 'Login failed. Please try again.';
            try {
                const errorResult = await response.json();
                console.error('Login API error response:', errorResult);
                if (errorResult.message) {
                    errorMessage = errorResult.message;
                } else if (errorResult.errors) {
                    // If the server sends specific field errors, display them
                    errorMessage = Object.values(errorResult.errors).join('\n');
                }
            } catch (jsonError) {
                console.error('Failed to parse error response JSON:', jsonError);
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            showMessage(errorMessage, 'error');
            return; // Stop execution if response is not OK
        }

        const result = await response.json();
        console.log('Login API response result:', result);
        
        if (result.success) {
            // Store user data in localStorage
            localStorage.setItem('user_id', result.user.id);
            localStorage.setItem('user_email', result.user.email);
            localStorage.setItem('user_name', result.user.name || result.user.email);
            localStorage.setItem('user_role', result.user.role);
            localStorage.setItem('login_time', new Date().toISOString());
            
            // Show success message
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
            
        } else {
            // This block handles cases where response.ok is true, but result.success is false
            // (e.g., custom application-level errors returned with 200 OK status)
            let errorMessage = result.message || 'Login failed. Please try again.';
            if (result.locked_until) {
                const lockTime = new Date(result.locked_until);
                const timeRemaining = Math.ceil((lockTime - new Date()) / (1000 * 60));
                errorMessage = `Account temporarily locked. Try again in ${timeRemaining} minutes.`;
            }
            showMessage(errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('Login network error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Reset loading state
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
}

// Check if user is already logged in
function checkExistingLogin() {
    const userId = localStorage.getItem('user_id');
    const loginTime = localStorage.getItem('login_time');
    
    if (userId && loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursSinceLogin = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursSinceLogin < 24) {
            window.location.href = '/dashboard.html';
            return true; // Redirecting
        } else {
            localStorage.clear();
        }
    }
    return false; // Not redirecting
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    if (checkExistingLogin()) {
        return; // Stop execution if redirecting
    }
    
    // Disable submit button until CSRF token is fetched
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.disabled = true;
        console.log('Login button disabled.');
    }

    // Fetch CSRF token
    await fetchCSRFToken();
    console.log('fetchCSRFToken completed. Current csrfToken:', csrfToken);
    
    // Enable submit button after CSRF token is fetched
    if (loginBtn) {
        loginBtn.disabled = false;
        console.log('Login button enabled.');
    }

    // Attach form submission handler
    const loginForm = document.querySelector('#loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('Login form event listener attached.');
    }
    
    // Add input event listeners for real-time validation
    const emailInput = document.querySelector('#email');
    const passwordInput = document.querySelector('#password');
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !isValidEmail(this.value)) {
                showMessage('Please enter a valid email address.', 'error');
            }
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('blur', function() {
            if (this.value.length > 0 && this.value.length < 6) {
                showMessage('Password must be at least 6 characters long.', 'error');
            } else if (this.value.length >= 6) {
                // Clear message if valid
                showMessage('', 'info');
            }
        });
    }
});
