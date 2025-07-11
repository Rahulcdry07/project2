// Show message to user
window.showMessage = function(message, type = 'info') {
    const messageDiv = document.querySelector('.message');
    console.log('showMessage called. messageDiv:', messageDiv);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `alert message alert-${type}`;
        messageDiv.style.display = 'block';
        console.log('Message displayed. messageDiv.style.display:', messageDiv.style.display);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
            console.log('Message hidden.');
        }, 5000);
    }
};

// Validate email format
window.isValidEmail = function(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
window.isValidPassword = function(password) {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let message = '';
    let isValid = true;

    if (password.length < minLength) {
        message += `Password must be at least ${minLength} characters long. `;
        isValid = false;
    }
    if (!hasUppercase) {
        message += 'Must contain at least one uppercase letter. ';
        isValid = false;
    }
    if (!hasLowercase) {
        message += 'Must contain at least one lowercase letter. ';
        isValid = false;
    }
    if (!hasNumber) {
        message += 'Must contain at least one number. ';
        isValid = false;
    }
    if (!hasSpecialChar) {
        message += 'Must contain at least one special character. ';
        isValid = false;
    }

    return { isValid, message: message.trim() };
};
