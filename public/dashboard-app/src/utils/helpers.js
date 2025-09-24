/**
 * Common HTTP response status codes and their descriptions
 */
export const HTTP_STATUS = {
    // Success responses
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,

    // Client error responses
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    
    // Server error responses
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

/**
 * Formats error messages for display
 * @param {Error|string|Object} error - The error to format
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred';
    
    if (typeof error === 'string') return error;
    
    if (error.message) return error.message;
    
    if (error.error) return typeof error.error === 'string' 
        ? error.error 
        : JSON.stringify(error.error);
    
    return JSON.stringify(error);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
    if (!password || password.length < 8) {
        return {
            isValid: false,
            message: 'Password must be at least 8 characters long'
        };
    }
    
    // Check for at least one uppercase letter, one lowercase letter, one number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
        return {
            isValid: false,
            message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        };
    }
    
    return { isValid: true, message: '' };
};

/**
 * Truncate text to a specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};

/**
 * Format date to a readable string
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat('en-US', {
        ...defaultOptions,
        ...options
    }).format(dateObj);
};