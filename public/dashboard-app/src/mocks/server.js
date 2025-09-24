import { rest } from 'msw';
import { setupServer } from 'msw/node';

// Base URL for API endpoints
const baseUrl = 'http://localhost:3000/api';

// Define handlers array
const handlers = [
  // Auth API handlers
  rest.post(`${baseUrl}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body;
    
    // Mock successful login
    if (email === 'test@example.com' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
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
        })
      );
    }
    
    // Mock failed login
    return res(
      ctx.status(401),
      ctx.json({
        status: 'error',
        message: 'Invalid email or password'
      })
    );
  }),
  
  rest.post(`${baseUrl}/auth/register`, (req, res, ctx) => {
    const { email } = req.body;
    
    // Mock existing user error
    if (email === 'existing@example.com') {
      return res(
        ctx.status(400),
        ctx.json({
          status: 'error',
          message: 'User with this email already exists'
        })
      );
    }
    
    // Mock successful registration
    return res(
      ctx.status(201),
      ctx.json({
        status: 'success',
        message: 'User registered successfully. Please verify your email.',
        data: {
          user: {
            id: 2,
            username: req.body.username,
            email: req.body.email,
            role: 'user',
            is_verified: false
          }
        }
      })
    );
  }),
  
  rest.post(`${baseUrl}/auth/forgot-password`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        message: 'If your email address is in our database, you will receive a password reset link.'
      })
    );
  }),
  
  rest.post(`${baseUrl}/auth/reset-password`, (req, res, ctx) => {
    const { token } = req.body;
    
    // Mock invalid token
    if (token === 'invalid-token') {
      return res(
        ctx.status(400),
        ctx.json({
          status: 'error',
          message: 'Invalid or expired token'
        })
      );
    }
    
    // Mock successful password reset
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        message: 'Password has been reset successfully'
      })
    );
  }),
  
  rest.post(`${baseUrl}/verify-email`, (req, res, ctx) => {
    const { token } = req.body;
    
    // Mock invalid token
    if (token === 'invalid-token') {
      return res(
        ctx.status(400),
        ctx.json({
          status: 'error',
          message: 'Invalid or expired token'
        })
      );
    }
    
    // Mock successful verification
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        message: 'Email verified successfully'
      })
    );
  }),
  
  // Profile API handlers
  rest.get(`${baseUrl}/profile`, (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return res(
        ctx.status(401),
        ctx.json({
          status: 'error',
          message: 'Unauthorized'
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
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
      })
    );
  }),
  
  rest.put(`${baseUrl}/profile`, (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return res(
        ctx.status(401),
        ctx.json({
          status: 'error',
          message: 'Unauthorized'
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
          ...req.body,
          id: 1,
          role: 'user',
          is_verified: true
        }
      })
    );
  }),
  
  // Admin API handlers
  rest.get(`${baseUrl}/admin/users`, (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return res(
        ctx.status(401),
        ctx.json({
          status: 'error',
          message: 'Unauthorized'
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json([
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
      ])
    );
  }),
  
  rest.put(`${baseUrl}/admin/users/:id/role`, (req, res, ctx) => {
    const { id } = req.params;
    const { role } = req.body;
    
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(id),
        username: 'user',
        email: 'user@example.com',
        role: role,
        is_verified: true
      })
    );
  }),
  
  rest.delete(`${baseUrl}/admin/users/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'User deleted successfully'
      })
    );
  })
];

// Setup MSW server
const server = setupServer(...handlers);

export { server, rest, baseUrl };