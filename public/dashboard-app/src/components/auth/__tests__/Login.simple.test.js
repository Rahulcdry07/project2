import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';
import { setupMockFetch } from '../../../test-utils/mockAPI';
import { authAPI } from '../../../services/api';
import Login from '../Login';

// Mock the auth utilities
jest.mock('../../../utils/auth', () => ({
  setAuthData: jest.fn(),
  getToken: jest.fn(() => null),
  getCurrentUser: jest.fn(() => null),
  clearAuthData: jest.fn(),
  isValidEmail: jest.fn((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
}));

// Mock the API service
jest.mock('../../../services/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn()
  }
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
    jest.clearAllMocks();
    user = userEvent.setup();
    mockNavigate.mockClear();
    authAPI.login.mockClear();
  });

  test('renders login form correctly', () => {
    renderWithProviders(<Login />);

    // Check if the important elements are in the document
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    renderWithProviders(<Login />);

    // Submit the form without filling any fields
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    renderWithProviders(<Login />);

    // Enter an invalid email
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Check for email validation error (actual text from component)
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  test('submits the form with valid inputs', async () => {
    // Setup successful API response
    authAPI.login.mockResolvedValue({
      status: 'success',
      data: {
        user: { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' },
        token: 'fake-token'
      }
    });

    renderWithProviders(<Login />);

    // Fill in the form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Wait for the API call
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
    });
  });

  test('handles login error', async () => {
    // Setup API to throw error
    authAPI.login.mockRejectedValue(new Error('Invalid credentials'));

    renderWithProviders(<Login />);

    // Fill in the form with any credentials
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /login/i }));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('renders submit button', () => {
    renderWithProviders(<Login />);

    // Check that the button is rendered
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});