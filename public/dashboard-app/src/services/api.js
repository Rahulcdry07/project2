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
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'An error occurred');
        }
        
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};

/**
 * Authentication API methods
 */
export const authAPI = {
    login: (email, password) => {
        return fetchWithErrorHandling(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: createHeaders(false),
            body: JSON.stringify({ email, password })
        });
    },
    
    register: (username, email, password) => {
        return fetchWithErrorHandling(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: createHeaders(false),
            body: JSON.stringify({ username, email, password })
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
 * Profile API methods
 */
export const profileAPI = {
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