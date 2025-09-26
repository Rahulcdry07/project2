/**
 * API service for making requests to backend
 */
import { getToken } from '../utils/auth';

const API_URL = '/api';

/**
 * Create headers with authentication token
 * @param {boolean} includeAuth - Whether to include auth token
 * @returns {Object} Headers object
 */
const createHeaders = (includeAuth = true) => {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (includeAuth) {
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
};

/**
 * Generic fetch wrapper with error handling
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} Response data or error
 */
const fetchWithErrorHandling = async (url, options) => {
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || result.message || 'An error occurred');
        }
        
        // Return the data property if it exists, otherwise return the whole result
        return result.data || result;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

/**
 * Authentication API methods
 */
export const authAPI = {
    login: (credentials) => {
        return fetchWithErrorHandling(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: createHeaders(false),
            body: JSON.stringify(credentials)
        });
    },
    
    register: (userData) => {
        return fetchWithErrorHandling(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: createHeaders(false),
            body: JSON.stringify(userData)
        });
    },
    
    verifyEmail: (token) => {
        return fetchWithErrorHandling(`${API_URL}/auth/verify-email`, {
            method: 'POST',
            headers: createHeaders(false),
            body: JSON.stringify({ token })
        });
    },
    
    forgotPassword: (email) => {
        return fetchWithErrorHandling(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: createHeaders(false),
            body: JSON.stringify({ email })
        });
    },
    
    resetPassword: (token, password) => {
        return fetchWithErrorHandling(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: createHeaders(false),
            body: JSON.stringify({ token, password })
        });
    }
};

/**
 * User API methods
 */
export const userAPI = {
    getProfile: () => {
        return fetchWithErrorHandling(`${API_URL}/profile`, {
            method: 'GET',
            headers: createHeaders()
        });
    },
    
    updateProfile: (userData) => {
        return fetchWithErrorHandling(`${API_URL}/profile`, {
            method: 'PUT',
            headers: createHeaders(),
            body: JSON.stringify(userData)
        });
    }
};

/**
 * Profile API methods (alias for backward compatibility)
 */
export const profileAPI = userAPI;

/**
 * Admin API methods
 */
export const adminAPI = {
    getAllUsers: () => {
        return fetchWithErrorHandling(`${API_URL}/admin/users`, {
            method: 'GET',
            headers: createHeaders()
        });
    },
    
    updateUserRole: (userId, role) => {
        return fetchWithErrorHandling(`${API_URL}/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: createHeaders(),
            body: JSON.stringify({ role })
        });
    },
    
    deleteUser: (userId) => {
        return fetchWithErrorHandling(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: createHeaders()
        });
    }
};