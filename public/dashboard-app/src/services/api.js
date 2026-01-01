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
    'Content-Type': 'application/json',
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

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned invalid response format');
    }

    const text = await response.text();
    if (!text) {
      throw new Error('Server returned empty response');
    }

    const result = JSON.parse(text);

    if (!response.ok) {
      throw new Error(result.error || result.message || 'An error occurred');
    }

    // Return the data property if it exists, otherwise return the whole result
    return result.data || result;
  } catch (error) {
    if (error.message.includes('JSON')) {
      throw new Error('Server error: Invalid response format');
    }
    throw error;
  }
};

/**
 * Authentication API methods
 */
export const authAPI = {
  login: credentials => {
    return fetchWithErrorHandling(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify(credentials),
    });
  },

  register: userData => {
    return fetchWithErrorHandling(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify(userData),
    });
  },

  verifyEmail: token => {
    return fetchWithErrorHandling(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify({ token }),
    });
  },

  forgotPassword: email => {
    return fetchWithErrorHandling(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: (token, password) => {
    return fetchWithErrorHandling(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: createHeaders(false),
      body: JSON.stringify({ token, password }),
    });
  },
};

/**
 * User API methods
 */
export const userAPI = {
  getProfile: () => {
    return fetchWithErrorHandling(`${API_URL}/profile`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  updateProfile: userData => {
    return fetchWithErrorHandling(`${API_URL}/profile`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(userData),
    });
  },
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
      headers: createHeaders(),
    });
  },

  updateUserRole: (userId, role) => {
    return fetchWithErrorHandling(`${API_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({ role }),
    });
  },

  deleteUser: userId => {
    return fetchWithErrorHandling(`${API_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

/**
 * Settings API methods
 */
export const settingsAPI = {
  getSettings: () => {
    return fetchWithErrorHandling(`${API_URL}/settings`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  updateSettings: settings => {
    return fetchWithErrorHandling(`${API_URL}/settings`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(settings),
    });
  },

  changePassword: (currentPassword, newPassword) => {
    return fetchWithErrorHandling(`${API_URL}/settings/change-password`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  updateEmail: (email, password) => {
    return fetchWithErrorHandling(`${API_URL}/settings/email`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({ email, password }),
    });
  },
};

/**
 * Activity API methods
 */
export const activityAPI = {
  getActivityLogs: (page = 1, limit = 20) => {
    return fetchWithErrorHandling(`${API_URL}/activity?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },
};

/**
 * Notification API methods
 */
export const notificationAPI = {
  getNotifications: (page = 1, limit = 20, unreadOnly = false) => {
    return fetchWithErrorHandling(
      `${API_URL}/notifications?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`,
      {
        method: 'GET',
        headers: createHeaders(),
      }
    );
  },

  markAsRead: id => {
    return fetchWithErrorHandling(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: createHeaders(),
    });
  },

  markAllAsRead: () => {
    return fetchWithErrorHandling(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: createHeaders(),
    });
  },

  deleteNotification: id => {
    return fetchWithErrorHandling(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

/**
 * Notes API methods
 */
export const notesAPI = {
  getNotes: (page = 1, limit = 50) => {
    return fetchWithErrorHandling(`${API_URL}/notes?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  getNote: id => {
    return fetchWithErrorHandling(`${API_URL}/notes/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
  },

  createNote: noteData => {
    return fetchWithErrorHandling(`${API_URL}/notes`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(noteData),
    });
  },

  updateNote: (id, noteData) => {
    return fetchWithErrorHandling(`${API_URL}/notes/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(noteData),
    });
  },

  deleteNote: id => {
    return fetchWithErrorHandling(`${API_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

/**
 * Tender API methods
 */
export const tenderAPI = {
  getTenders: (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    const queryString = queryParams.toString();
    const url = queryString ? `${API_URL}/v1/tenders?${queryString}` : `${API_URL}/v1/tenders`;
    return fetchWithErrorHandling(url, {
      method: 'GET',
      headers: createHeaders(false), // Public endpoint
    });
  },

  getTender: id => {
    return fetchWithErrorHandling(`${API_URL}/v1/tenders/${id}`, {
      method: 'GET',
      headers: createHeaders(false), // Public endpoint
    });
  },

  createTender: tenderData => {
    return fetchWithErrorHandling(`${API_URL}/v1/tenders`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(tenderData),
    });
  },

  updateTender: (id, tenderData) => {
    return fetchWithErrorHandling(`${API_URL}/v1/tenders/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(tenderData),
    });
  },

  deleteTender: id => {
    return fetchWithErrorHandling(`${API_URL}/v1/tenders/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
  },
};

// Export API_URL for other components
export { API_URL };
