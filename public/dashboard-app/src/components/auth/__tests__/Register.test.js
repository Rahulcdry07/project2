import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import { authAPI } from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  authAPI: {
    register: jest.fn()
  }
}));

// Mock the react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Register Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders register form correctly', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Check if the important elements are in the document
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('validates username length', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Enter a username that's too short
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'ab' } });
    fireEvent.blur(screen.getByLabelText(/username/i)); // Trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    });

    // Enter a valid username
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'validuser' } });
    fireEvent.blur(screen.getByLabelText(/username/i)); // Trigger blur validation

    // Wait for validation error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/username must be at least 3 characters/i)).not.toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    render(
      <BrowserRouter>
        <Register />
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

  test('validates password length', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Enter a password that's too short
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: '12345' } });
    fireEvent.blur(screen.getByLabelText(/password/i)); // Trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    // Enter a valid password
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.blur(screen.getByLabelText(/password/i)); // Trigger blur validation

    // Wait for validation error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/password must be at least 6 characters/i)).not.toBeInTheDocument();
    });
  });

  test('submits the form with valid inputs', async () => {
    // Mock successful registration
    authAPI.register.mockResolvedValue({
      message: 'Registration successful. Please check your email to verify your account.'
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for the API call to be made
    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('handles registration error', async () => {
    // Mock failed registration
    const errorMessage = 'Username already exists';
    authAPI.register.mockRejectedValue(new Error(errorMessage));

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Ensure navigation didn't happen
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('disables the button during submission', async () => {
    // Mock registration with a delay to test the loading state
    authAPI.register.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          message: 'Registration successful. Please check your email to verify your account.'
        });
      }, 100);
    }));

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check if the button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /registering/i })).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});