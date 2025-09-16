import axios from 'axios';
import { authAPI, profileAPI, dashboardAPI, adminAPI } from '../api';

// Mock axios
jest.mock('axios');

describe('API Services', () => {
  beforeEach(() => {
    // Clear all axios mocks
    jest.clearAllMocks();
    // Mock localStorage
    global.localStorage = {
      getItem: jest.fn(() => 'mock-token'),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
  });

  describe('authAPI', () => {
    test('login makes correct API call', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: { id: 1, username: 'testuser' },
            token: 'jwt-token'
          }
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authAPI.login('testuser', 'password123');

      expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'testuser',
        password: 'password123'
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('register makes correct API call', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Registration successful'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authAPI.register('testuser', 'test@example.com', 'password123');

      expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('validateToken makes correct API call with token header', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, username: 'testuser' }
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await authAPI.validateToken('test-token');

      expect(axios.get).toHaveBeenCalledWith('/api/auth/validate-token', {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('logout removes token and makes API call', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Logged out successfully'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      await authAPI.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(axios.post).toHaveBeenCalledWith('/api/auth/logout');
    });

    test('forgotPassword makes correct API call', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Password reset link sent'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authAPI.forgotPassword('test@example.com');

      expect(axios.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
        email: 'test@example.com'
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('resetPassword makes correct API call', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Password reset successfully'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authAPI.resetPassword('reset-token', 'newPassword123');

      expect(axios.post).toHaveBeenCalledWith('/api/auth/reset-password', {
        token: 'reset-token',
        password: 'newPassword123'
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('verifyEmail makes correct API call', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Email verified successfully'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await authAPI.verifyEmail('verification-token');

      expect(axios.post).toHaveBeenCalledWith('/api/auth/verify-email', {
        token: 'verification-token'
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('profileAPI', () => {
    test('getProfile makes correct API call with auth header', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, username: 'testuser', email: 'test@example.com' }
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await profileAPI.getProfile();

      expect(axios.get).toHaveBeenCalledWith('/api/profile', {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('updateProfile makes correct API call with auth header', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, username: 'testuser', firstName: 'Test', lastName: 'User' }
        }
      };
      axios.put.mockResolvedValue(mockResponse);

      const profileData = { firstName: 'Test', lastName: 'User' };
      const result = await profileAPI.updateProfile(profileData);

      expect(axios.put).toHaveBeenCalledWith('/api/profile', profileData, {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('changePassword makes correct API call with auth header', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Password changed successfully'
        }
      };
      axios.post.mockResolvedValue(mockResponse);

      const result = await profileAPI.changePassword('oldPassword', 'newPassword');

      expect(axios.post).toHaveBeenCalledWith('/api/profile/change-password', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword'
      }, {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('dashboardAPI', () => {
    test('getDashboardData makes correct API call with auth header', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            stats: { userCount: 100 },
            recentActivity: [{ id: 1, action: 'login' }]
          }
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await dashboardAPI.getDashboardData();

      expect(axios.get).toHaveBeenCalledWith('/api/dashboard', {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('adminAPI', () => {
    test('getUsers makes correct API call with auth header', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            { id: 1, username: 'user1' },
            { id: 2, username: 'user2' }
          ]
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await adminAPI.getUsers();

      expect(axios.get).toHaveBeenCalledWith('/api/admin/users', {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('getUserById makes correct API call with auth header', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, username: 'user1' }
        }
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await adminAPI.getUserById(1);

      expect(axios.get).toHaveBeenCalledWith('/api/admin/users/1', {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('updateUser makes correct API call with auth header', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { id: 1, username: 'user1', role: 'admin' }
        }
      };
      axios.put.mockResolvedValue(mockResponse);

      const userData = { role: 'admin' };
      const result = await adminAPI.updateUser(1, userData);

      expect(axios.put).toHaveBeenCalledWith('/api/admin/users/1', userData, {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    test('deleteUser makes correct API call with auth header', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'User deleted successfully'
        }
      };
      axios.delete.mockResolvedValue(mockResponse);

      const result = await adminAPI.deleteUser(1);

      expect(axios.delete).toHaveBeenCalledWith('/api/admin/users/1', {
        headers: { 'Authorization': 'Bearer mock-token' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  test('handles API errors correctly', async () => {
    const errorResponse = {
      response: {
        data: {
          success: false,
          message: 'Authentication failed'
        },
        status: 401
      }
    };
    axios.post.mockRejectedValue(errorResponse);

    try {
      await authAPI.login('testuser', 'wrongpassword');
      // If we reach here, test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe('Authentication failed');
    }
  });

  test('handles network errors correctly', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));

    try {
      await authAPI.login('testuser', 'password123');
      // If we reach here, test should fail
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe('Network Error');
    }
  });
});