/**
 * Mock API utilities for testing
 * This provides a simpler alternative to MSW for component testing
 */

// Mock responses for different API endpoints
export const mockApiResponses = {
  // Auth endpoints
  '/api/auth/login': {
    success: {
      status: 'success',
      data: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          is_verified: true
        },
        token: 'fake-jwt-token'
      }
    },
    failure: {
      status: 'error',
      message: 'Invalid email or password'
    }
  },
  
  '/api/auth/register': {
    success: {
      status: 'success',
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: {
          id: 2,
          username: 'newuser',
          email: 'new@example.com',
          role: 'user',
          is_verified: false
        }
      }
    },
    failure: {
      status: 'error',
      message: 'User with this email already exists'
    }
  },

  '/api/auth/forgot-password': {
    success: {
      status: 'success',
      message: 'If your email address is in our database, you will receive a password reset link.'
    }
  },

  '/api/auth/reset-password': {
    success: {
      status: 'success',
      message: 'Password has been reset successfully'
    },
    failure: {
      status: 'error',
      message: 'Invalid or expired token'
    }
  },

  '/api/verify-email': {
    success: {
      status: 'success',
      message: 'Email verified successfully'
    },
    failure: {
      status: 'error',
      message: 'Invalid or expired token'
    }
  },

  // Profile endpoints
  '/api/profile': {
    get: {
      status: 'success',
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        is_verified: true,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      }
    },
    put: {
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        role: 'user',
        is_verified: true
      }
    }
  },

  // Admin endpoints
  '/api/admin/users': {
    success: [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        is_verified: true,
        created_at: '2023-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        username: 'user',
        email: 'user@example.com',
        role: 'user',
        is_verified: true,
        created_at: '2023-01-02T00:00:00.000Z'
      }
    ]
  }
};

/**
 * Create a mock fetch function that responds to specific endpoints
 * @param {Object} customResponses - Custom responses to override defaults
 * @returns {Function} Mock fetch function
 */
export const createMockFetch = (customResponses = {}) => {
  return jest.fn((url, options = {}) => {
    const method = options.method || 'GET';
    const endpoint = url.replace('http://localhost:3000', '');
    
    // Merge custom responses with defaults
    const responses = { ...mockApiResponses, ...customResponses };
    
    // Helper function to create a response
    const createResponse = (data, status = 200) => {
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      });
    };

    // Route requests to appropriate responses
    switch (endpoint) {
      case '/api/auth/login':
        if (method === 'POST') {
          // Check if it's a failure scenario based on body
          const body = JSON.parse(options.body || '{}');
          if (body.email === 'invalid@example.com') {
            return createResponse(responses[endpoint].failure, 401);
          }
          return createResponse(responses[endpoint].success);
        }
        break;
        
      case '/api/auth/register':
        if (method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          if (body.email === 'existing@example.com') {
            return createResponse(responses[endpoint].failure, 400);
          }
          return createResponse(responses[endpoint].success, 201);
        }
        break;
        
      case '/api/auth/forgot-password':
        if (method === 'POST') {
          return createResponse(responses[endpoint].success);
        }
        break;
        
      case '/api/auth/reset-password':
        if (method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          if (body.token === 'invalid-token') {
            return createResponse(responses[endpoint].failure, 400);
          }
          return createResponse(responses[endpoint].success);
        }
        break;
        
      case '/api/verify-email':
        if (method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          if (body.token === 'invalid-token') {
            return createResponse(responses[endpoint].failure, 400);
          }
          return createResponse(responses[endpoint].success);
        }
        break;
        
      case '/api/profile':
        if (method === 'GET') {
          // Check for auth header
          if (!options.headers?.['Authorization'] && !options.headers?.['authorization']) {
            return createResponse({ status: 'error', message: 'Unauthorized' }, 401);
          }
          return createResponse(responses[endpoint].get);
        }
        if (method === 'PUT') {
          if (!options.headers?.['Authorization'] && !options.headers?.['authorization']) {
            return createResponse({ status: 'error', message: 'Unauthorized' }, 401);
          }
          return createResponse(responses[endpoint].put);
        }
        break;
        
      case '/api/admin/users':
        if (method === 'GET') {
          if (!options.headers?.['Authorization'] && !options.headers?.['authorization']) {
            return createResponse({ status: 'error', message: 'Unauthorized' }, 401);
          }
          return createResponse(responses[endpoint].success);
        }
        break;
        
      default:
        // Handle dynamic routes like /api/admin/users/:id/role
        if (endpoint.match(/^\/api\/admin\/users\/\d+\/role$/)) {
          if (method === 'PUT') {
            const userId = endpoint.match(/\/api\/admin\/users\/(\d+)\/role$/)[1];
            const body = JSON.parse(options.body || '{}');
            return createResponse({
              id: Number(userId),
              username: 'user',
              email: 'user@example.com',
              role: body.role,
              is_verified: true
            });
          }
        }
        
        if (endpoint.match(/^\/api\/admin\/users\/\d+$/)) {
          if (method === 'DELETE') {
            return createResponse({ message: 'User deleted successfully' });
          }
        }
        
        // Default: return 404
        return createResponse({ status: 'error', message: 'Not found' }, 404);
    }
    
    // Fallback
    return createResponse({ status: 'error', message: 'Not found' }, 404);
  });
};

/**
 * Setup mock fetch for tests
 * @param {Object} customResponses - Custom responses to override defaults
 */
export const setupMockFetch = (customResponses = {}) => {
  const mockFetch = createMockFetch(customResponses);
  global.fetch = mockFetch;
  return mockFetch;
};

/**
 * Cleanup mock fetch after tests
 */
export const cleanupMockFetch = () => {
  if (global.fetch && global.fetch.mockRestore) {
    global.fetch.mockRestore();
  }
  delete global.fetch;
};