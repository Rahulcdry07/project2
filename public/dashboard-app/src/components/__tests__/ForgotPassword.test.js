import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '../ForgotPassword';
import { rest } from 'msw';
import { server, baseUrl } from '../../mocks/server';
import { renderWithProviders } from '../../test-utils';

describe('ForgotPassword Component', () => {
  let user;
  
  beforeEach(() => {
    // Setup userEvent
    user = userEvent.setup();
    // Reset MSW handlers
    server.resetHandlers();
  });

  test('renders forgot password form correctly', () => {
    renderWithProviders(<ForgotPassword />);

    // Check if the important elements are in the document
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });

  test('validates email format', async () => {
    renderWithProviders(<ForgotPassword />);

    // Submit the form without filling any fields
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    // Enter an invalid email
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.tab(); // Move focus away to trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    // Clear and enter a valid email
    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.tab(); // Move focus away to trigger blur validation

    // Wait for validation error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
    });
  });

  test('submits the form with valid email and shows success message', async () => {
    // Mock successful password reset request
    server.use(
      rest.post(`${baseUrl}/auth/forgot-password`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            message: 'Password reset link sent to your email'
          })
        );
      })
    );

    renderWithProviders(<ForgotPassword />);

    // Fill in the form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/password reset link sent to your email/i)).toBeInTheDocument();
    });
  });

  test('handles error when sending reset link', async () => {
    // Mock error response
    const errorMessage = 'Email not found in our records';
    server.use(
      rest.post(`${baseUrl}/auth/forgot-password`, (req, res, ctx) => {
        return res(
          ctx.status(404),
          ctx.json({
            status: 'error',
            message: errorMessage
          })
        );
      })
    );

    renderWithProviders(<ForgotPassword />);

    // Fill in the form
    await user.type(screen.getByLabelText(/email/i), 'unknown@example.com');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('disables the button during submission', async () => {
    // Mock forgot password with a delay to test the loading state
    server.use(
      rest.post(`${baseUrl}/auth/forgot-password`, async (req, res, ctx) => {
        // Add a delay to simulate network latency
        await new Promise(resolve => setTimeout(resolve, 100));
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            message: 'Password reset link sent to your email'
          })
        );
      })
    );

    renderWithProviders(<ForgotPassword />);

    // Fill in the form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    // Check if the button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText(/password reset link sent to your email/i)).toBeInTheDocument();
    });
  });

  test('navigates to login page when clicking back to login', async () => {
    renderWithProviders(<ForgotPassword />);
    
    // Check that the link points to the login page
    expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute('href', '/login');
  });
});