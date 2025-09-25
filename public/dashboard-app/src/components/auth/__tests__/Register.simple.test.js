import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test-utils';
import { authAPI } from '../../../services/api';
import Register from '../Register';

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

describe('Register Component', () => {
  let user;
  
  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
    mockNavigate.mockClear();
    authAPI.register.mockClear();
  });

  test('renders register form correctly', () => {
    renderWithProviders(<Register />);

    // Check if the important elements are in the document
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    renderWithProviders(<Register />);

    // Submit the form without filling any fields
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('validates username length', async () => {
    renderWithProviders(<Register />);

    // Enter a username that's too short
    await user.type(screen.getByLabelText(/username/i), 'ab');
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Check for username validation error
    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    renderWithProviders(<Register />);

    // Enter an invalid email
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Check for email validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  test('validates password length', async () => {
    renderWithProviders(<Register />);

    // Enter a password that's too short
    await user.type(screen.getByLabelText(/^password/i), '12345');
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Check for password validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
    });
  });

  test('validates password confirmation', async () => {
    renderWithProviders(<Register />);

    // Enter different passwords
    await user.type(screen.getByLabelText(/^password/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different123');
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Check for password confirmation error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  test('submits the form with valid inputs', async () => {
    // Setup successful API response
    authAPI.register.mockResolvedValue({
      status: 'success',
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: { id: 2, username: 'testuser', email: 'test@example.com', role: 'user' }
      }
    });

    renderWithProviders(<Register />);

    // Fill in the form with valid data
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
    
    // Accept terms
    await user.click(screen.getByRole('checkbox', { name: /terms and conditions/i }));

    // Submit the form
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Wait for the API call
    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalledWith(
        'testuser',
        'test@example.com',
        'Password123'
      );
    });

    // Check for success state
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
  });

  test('handles registration error', async () => {
    // Setup API to throw error
    authAPI.register.mockRejectedValue(new Error('User with this email already exists'));

    renderWithProviders(<Register />);

    // Fill in the form with valid data
    await user.type(screen.getByLabelText(/username/i), 'existinguser');
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
    
    // Accept terms
    await user.click(screen.getByRole('checkbox', { name: /terms and conditions/i }));

    // Submit the form
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/user with this email already exists/i)).toBeInTheDocument();
    });
  });

});