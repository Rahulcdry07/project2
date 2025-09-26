import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, AuthContext, useAuth } from '../AuthContext';
import { rest } from 'msw';
import { server, baseUrl } from '../../mocks/server';

// Test component that consumes auth context
const TestComponent = () => {
  const { user, isAuthenticated, loading, login, logout, updateUser } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {loading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      <div data-testid="user-data">{user ? JSON.stringify(user) : 'No user'}</div>
      
      <button 
        onClick={() => login('test@example.com', 'password123')}
        disabled={loading}
      >
        Login
      </button>
      
      <button 
        onClick={() => logout()}
        disabled={!isAuthenticated || loading}
      >
        Logout
      </button>
      
      <button 
        onClick={() => updateUser({ ...user, username: 'updated-username' })}
        disabled={!isAuthenticated || loading}
      >
        Update User
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  let user;
  
  beforeEach(() => {
    // Setup userEvent
    user = userEvent.setup();
    // Clear localStorage
    window.localStorage.clear();
    // Reset MSW handlers
    server.resetHandlers();
  });

  test('provides initial unauthenticated state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Initially should show loading
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Loading...');
    
    // After initialization should show not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(screen.getByTestId('user-data')).toHaveTextContent('No user');
    });
  });

  test('loads authenticated user from token in localStorage', async () => {
    // Setup mock token in localStorage
    window.localStorage.setItem('token', 'valid-token');
    
    // Mock token validation endpoint
    server.use(
      rest.get(`${baseUrl}/auth/validate-token`, (req, res, ctx) => {
        const authHeader = req.headers.get('authorization');
        
        if (authHeader && authHeader.includes('valid-token')) {
          return res(
            ctx.status(200),
            ctx.json({
              status: 'success',
              data: {
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role: 'user'
              }
            })
          );
        }
        
        return res(
          ctx.status(401),
          ctx.json({
            status: 'error',
            message: 'Invalid token'
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Should initially show loading
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Loading...');
    
    // After token validation should show authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-data')).toHaveTextContent('testuser');
    });
  });

  test('removes invalid token from localStorage', async () => {
    // Setup mock invalid token in localStorage
    window.localStorage.setItem('token', 'invalid-token');
    
    // Mock token validation endpoint to reject the token
    server.use(
      rest.get(`${baseUrl}/auth/validate-token`, (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            status: 'error',
            message: 'Invalid token'
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // After token validation should show not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(window.localStorage.getItem('token')).toBeNull();
    });
  });

  test('handles successful login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
    
    // Click login button
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Should briefly show loading
    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
    
    // After login completes, should show authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-data')).toHaveTextContent('testuser');
      expect(window.localStorage.getItem('token')).toBe('fake-jwt-token');
    });
  });

  test('handles login failure', async () => {
    // Mock login endpoint to fail
    server.use(
      rest.post(`${baseUrl}/auth/login`, (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            status: 'error',
            message: 'Invalid credentials'
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });
    
    // Click login button
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // After failed login, should still be not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(window.localStorage.getItem('token')).toBeNull();
    });
  });

  test('handles logout correctly', async () => {
    // Setup authenticated state
    window.localStorage.setItem('token', 'valid-token');
    
    // Mock token validation endpoint
    server.use(
      rest.get(`${baseUrl}/auth/validate-token`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              id: 1,
              username: 'testuser',
              email: 'test@example.com',
              role: 'user'
            }
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
    
    // Click logout button
    await user.click(screen.getByRole('button', { name: /logout/i }));
    
    // After logout, should be not authenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      expect(screen.getByTestId('user-data')).toHaveTextContent('No user');
      expect(window.localStorage.getItem('token')).toBeNull();
    });
  });

  test('allows updating the user data', async () => {
    // Setup authenticated state
    window.localStorage.setItem('token', 'valid-token');
    
    // Mock token validation endpoint
    server.use(
      rest.get(`${baseUrl}/auth/validate-token`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              id: 1,
              username: 'testuser',
              email: 'test@example.com',
              role: 'user'
            }
          })
        );
      })
    );
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-data')).toHaveTextContent('testuser');
    });
    
    // Click update user button
    await user.click(screen.getByRole('button', { name: /update user/i }));
    
    // User data should be updated
    await waitFor(() => {
      expect(screen.getByTestId('user-data')).toHaveTextContent('updated-username');
    });
  });
});