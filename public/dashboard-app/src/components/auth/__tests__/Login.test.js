import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { authAPI } from '../../../services/api';
import { setAuthData } from '../../../utils/auth';

// Mock the API and auth utilities
jest.mock('../../../services/api', () => ({
  authAPI: {
    login: jest.fn()
  }
}));

jest.mock('../../../utils/auth', () => ({
  setAuthData: jest.fn()
}));

// Mock the react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders login form correctly', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Check if the important elements are in the document
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('handles email validation', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Enter an invalid email
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
    fireEvent.blur(screen.getByLabelText(/email/i)); // Trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    // Enter a valid email
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'valid@example.com' } });
    fireEvent.blur(screen.getByLabelText(/email/i)); // Trigger blur validation

    // Wait for validation error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
    });
  });

  test('submits the form with valid credentials', async () => {
    // Mock successful login
    authAPI.login.mockResolvedValue({
      user: { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' },
      token: 'test-token'
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for the API call to be made
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(setAuthData).toHaveBeenCalledWith(
        { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' },
        'test-token'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles login error', async () => {
    // Mock failed login
    const errorMessage = 'Invalid email or password';
    authAPI.login.mockRejectedValue(new Error(errorMessage));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Ensure navigation didn't happen
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('disables the button during submission', async () => {
    // Mock login with a delay to test the loading state
    authAPI.login.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          user: { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' },
          token: 'test-token'
        });
      }, 100);
    }));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Check if the button is disabled
    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});