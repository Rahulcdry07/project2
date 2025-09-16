import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import { authAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  authAPI: {
    resetPassword: jest.fn()
  }
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: () => jest.fn()
}));

describe('ResetPassword Component', () => {
  const mockToken = 'valid-reset-token';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Set up the mock token param
    useParams.mockReturnValue({ token: mockToken });
  });

  test('renders reset password form correctly', () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Check if the important elements are in the document
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  test('validates password fields', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/new password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });

    // Enter a password that's too short
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: '12345' } });
    fireEvent.blur(screen.getByLabelText(/new password/i)); // Trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    // Enter a valid password but different confirm password
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different123' } });
    fireEvent.blur(screen.getByLabelText(/confirm password/i)); // Trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Enter matching passwords
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.blur(screen.getByLabelText(/confirm password/i)); // Trigger blur validation

    // Wait for validation error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    });
  });

  test('submits the form with valid passwords', async () => {
    // Mock successful password reset
    authAPI.resetPassword.mockResolvedValue({
      success: true,
      message: 'Password reset successfully'
    });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Fill in the form with matching passwords
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    // Wait for the API call to be made
    await waitFor(() => {
      expect(authAPI.resetPassword).toHaveBeenCalledWith(mockToken, 'password123');
      expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
    });
  });

  test('handles reset password error', async () => {
    // Mock error response
    const errorMessage = 'Invalid or expired token';
    authAPI.resetPassword.mockRejectedValue(new Error(errorMessage));

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Fill in the form with matching passwords
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('handles case with missing token', async () => {
    // Mock missing token
    useParams.mockReturnValue({ token: null });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Should show error message about invalid token
    expect(screen.getByText(/invalid password reset link/i)).toBeInTheDocument();
    
    // Reset form should not be visible
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  test('disables the button during submission', async () => {
    // Mock reset password with a delay to test the loading state
    authAPI.resetPassword.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Password reset successfully'
        });
      }, 100);
    }));

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Fill in the form with matching passwords
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    // Check if the button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
    });
  });
});