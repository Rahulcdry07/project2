/**
 * Authentication utilities
 */

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

/**
 * Get the current user information from localStorage
 * @returns {Object|null} User object or null if not authenticated
 */
export const getCurrentUser = () => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
};

/**
 * Check if the current user is an admin
 * @returns {boolean} True if user is an admin
 */
export const isAdmin = () => {
    const user = getCurrentUser();
    return user && user.role === 'admin';
};

/**
 * Store user data in localStorage
 * @param {Object} userData - User data to store
 * @param {string} token - JWT token
 */
export const setAuthData = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
};

/**
 * Clear authentication data
 */
export const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

/**
 * Get the authentication token
 * @returns {string|null} JWT token or null
 */
export const getToken = () => {
    return localStorage.getItem('token');
};