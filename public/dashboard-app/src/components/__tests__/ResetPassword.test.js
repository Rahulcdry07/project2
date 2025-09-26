import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPassword from '../ResetPassword';
import { rest } from 'msw';
import { server, baseUrl } from '../../mocks/server';
import { renderWithProviders } from '../../test-utils';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: () => jest.fn()
}));

const { useParams } = require('react-router-dom');

describe('ResetPassword Component', () => {
  const mockToken = 'valid-reset-token';
  let user;
  
  beforeEach(() => {
    // Setup userEvent
    user = userEvent.setup();
    // Reset MSW handlers
    server.resetHandlers();
    // Set up the mock token param
    useParams.mockReturnValue({ token: mockToken });
  });

  test('renders reset password form correctly', () => {
    renderWithProviders(<ResetPassword />);

    // Check if the important elements are in the document
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  test('validates password fields', async () => {
    renderWithProviders(<ResetPassword />);

    // Submit the form without filling any fields
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/new password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });

    // Enter a password that's too short
    await user.type(screen.getByLabelText(/new password/i), '12345');
    await user.tab(); // Move focus away to trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    // Clear and enter a valid password but different confirm password
    await user.clear(screen.getByLabelText(/new password/i));
    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'different123');
    await user.tab(); // Move focus away to trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Clear and enter matching passwords
    await user.clear(screen.getByLabelText(/confirm password/i));
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.tab(); // Move focus away to trigger blur validation

    // Wait for validation error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    });
  });

  test('submits the form with valid passwords and shows success message', async () => {
    // Mock successful password reset
    server.use(
      rest.post(`${baseUrl}/auth/reset-password/${mockToken}`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            message: 'Password reset successfully'
          })
        );
      })
    );

    renderWithProviders(<ResetPassword />);

    // Fill in the form with matching passwords
    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
    });
  });

  test('handles reset password error', async () => {
    // Mock error response
    const errorMessage = 'Invalid or expired token';
    server.use(
      rest.post(`${baseUrl}/auth/reset-password/${mockToken}`, (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            status: 'error',
            message: errorMessage
          })
        );
      })
    );

    renderWithProviders(<ResetPassword />);

    // Fill in the form with matching passwords
    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('handles case with missing token', async () => {
    // Mock missing token
    useParams.mockReturnValue({ token: null });

    renderWithProviders(<ResetPassword />);

    // Should show error message about invalid token
    expect(screen.getByText(/invalid password reset link/i)).toBeInTheDocument();
    
    // Reset form should not be visible
    expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
  });

  test('disables the button during submission', async () => {
    // Mock reset password with a delay to test the loading state
    server.use(
      rest.post(`${baseUrl}/auth/reset-password/${mockToken}`, async (req, res, ctx) => {
        // Add a delay to simulate network latency
        await new Promise(resolve => setTimeout(resolve, 100));
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            message: 'Password reset successfully'
          })
        );
      })
    );

    renderWithProviders(<ResetPassword />);

    // Fill in the form with matching passwords
    await user.type(screen.getByLabelText(/new password/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // Check if the button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /resetting/i })).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
    });
  });
  
  test('navigates to login page when clicking back to login', async () => {
    renderWithProviders(<ResetPassword />);
    
    // Check that the link points to the login page
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login');
  });
});