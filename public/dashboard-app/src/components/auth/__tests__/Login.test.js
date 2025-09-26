import React from 'react';
import { render, screen, waitFor } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import { setAuthData } from '../../../utils/auth';
import { rest } from 'msw';
import { server, baseUrl } from '../../../mocks/server';

// Mock the auth utilities
jest.mock('../../../utils/auth', () => ({
  setAuthData: jest.fn(),
  isValidEmail: jest.fn((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
}));

// Mock the react-router-dom useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Login Component', () => {
  let user;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Setup userEvent
    user = userEvent.setup();
    // Reset mock server handlers
    server.resetHandlers();
  });

  test('renders login form with all expected elements', async () => {
    render(<Login />);

    // Check heading
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    
    // Check form inputs
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    
    // Check remember me checkbox
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    
    // Check links
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    
    // Check submit button
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('shows validation errors when submitting empty form', async () => {
    render(<Login />);
    
    // Submit empty form
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Check validation errors appear
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    // Ensure we didn't navigate away
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('validates email format correctly', async () => {
    render(<Login />);
    
    // Type invalid email
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.tab(); // Move focus to trigger blur validation
    
    // Check validation error appears
    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    
    // Clear and type valid email
    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), 'valid@example.com');
    await user.tab(); // Move focus to trigger blur validation
    
    // Check validation error disappears
    await waitFor(() => {
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
    });
  });

  test('handles successful login correctly', async () => {
    render(<Login />);
    
    // Fill form with valid credentials
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Wait for form submission to complete
    await waitFor(() => {
      // Check auth data was set
      expect(setAuthData).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'user'
        }),
        'fake-jwt-token'
      );
      
      // Check navigation to dashboard
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles login error correctly', async () => {
    // Override the default handler to simulate a login error
    server.use(
      rest.post(`${baseUrl}/auth/login`, (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({
            status: 'error',
            message: 'Invalid email or password'
          })
        );
      })
    );
    
    render(<Login />);
    
    // Fill form with invalid credentials
    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Check error message appears
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    
    // Ensure we didn't navigate away
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('shows loading state during form submission', async () => {
    // Create a delay in the login response
    server.use(
      rest.post(`${baseUrl}/auth/login`, (req, res, ctx) => {
        return res(
          ctx.delay(200),
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
      })
    );
    
    render(<Login />);
    
    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    
    // Click submit button
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Check loading state
    expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('redirects to register page when clicking register link', async () => {
    render(<Login />);
    
    // Click register link
    await user.click(screen.getByRole('link', { name: /register/i }));
    
    // Check URL contains register
    expect(window.location.pathname).toBe('/register');
  });

  test('redirects to forgot password page when clicking forgot password link', async () => {
    render(<Login />);
    
    // Click forgot password link
    await user.click(screen.getByRole('link', { name: /forgot password/i }));
    
    // Check URL contains forgot-password
    expect(window.location.pathname).toBe('/forgot-password');
  });
});