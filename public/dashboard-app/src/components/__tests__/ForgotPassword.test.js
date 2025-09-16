import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';
import { authAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  authAPI: {
    forgotPassword: jest.fn()
  }
}));

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  test('renders forgot password form correctly', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    // Check if the important elements are in the document
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  test('validates email format', async () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    // Enter an invalid email
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid-email' } });
    fireEvent.blur(screen.getByLabelText(/email/i)); // Trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    // Enter a valid email
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.blur(screen.getByLabelText(/email/i)); // Trigger blur validation

    // Wait for validation error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
    });
  });

  test('submits the form with valid email', async () => {
    // Mock successful password reset request
    authAPI.forgotPassword.mockResolvedValue({
      success: true,
      message: 'Password reset link sent to your email'
    });

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    // Wait for the API call to be made
    await waitFor(() => {
      expect(authAPI.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByText(/password reset link sent to your email/i)).toBeInTheDocument();
    });
  });

  test('handles error when sending reset link', async () => {
    // Mock error response
    const errorMessage = 'Email not found in our records';
    authAPI.forgotPassword.mockRejectedValue(new Error(errorMessage));

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'unknown@example.com' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('disables the button during submission', async () => {
    // Mock forgot password with a delay to test the loading state
    authAPI.forgotPassword.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Password reset link sent to your email'
        });
      }, 100);
    }));

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    // Check if the button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText(/password reset link sent to your email/i)).toBeInTheDocument();
    });
  });
});