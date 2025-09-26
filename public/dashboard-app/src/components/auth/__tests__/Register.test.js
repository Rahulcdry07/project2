import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../Register';
import { rest } from 'msw';
import { server, baseUrl } from '../../../mocks/server';
import { renderWithProviders } from '../../../test-utils';

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Register Component', () => {
  let user;
  
  beforeEach(() => {
    // Setup userEvent
    user = userEvent.setup();
    // Reset MSW handlers
    server.resetHandlers();
    // Reset navigate mock
    mockNavigate.mockReset();
  });

  test('renders register form correctly', () => {
    renderWithProviders(<Register />);

    // Check if the important elements are in the document
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    renderWithProviders(<Register />);

    // Submit the form without filling any fields
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Wait for validation errors to appear
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
    await user.tab(); // Move to next field to trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    });

    // Clear and enter a valid username
    await user.clear(screen.getByLabelText(/username/i));
    await user.type(screen.getByLabelText(/username/i), 'validuser');
    await user.tab(); // Move to next field to trigger blur validation

    // Wait for validation error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/username must be at least 3 characters/i)).not.toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    renderWithProviders(<Register />);

    // Enter an invalid email
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.tab(); // Move to next field to trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    // Clear and enter a valid email
    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), 'valid@example.com');
    await user.tab(); // Move to next field to trigger blur validation

    // Wait for validation error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
    });
  });

  test('validates password length', async () => {
    renderWithProviders(<Register />);

    // Enter a password that's too short
    await user.type(screen.getByLabelText(/password/i), '12345');
    await user.tab(); // Move focus away to trigger blur validation

    // Wait for validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    // Clear and enter a valid password
    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.tab(); // Move focus away to trigger blur validation

    // Wait for validation error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/password must be at least 6 characters/i)).not.toBeInTheDocument();
    });
  });

  test('submits the form with valid inputs and redirects to login', async () => {
    // Mock successful registration
    server.use(
      rest.post(`${baseUrl}/auth/register`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            message: 'Registration successful. Please check your email to verify your account.'
          })
        );
      })
    );

    renderWithProviders(<Register />);

    // Fill in the form
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Wait for navigation to login page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('handles registration error', async () => {
    // Mock failed registration
    const errorMessage = 'Username already exists';
    server.use(
      rest.post(`${baseUrl}/auth/register`, (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            status: 'error',
            message: errorMessage
          })
        );
      })
    );

    renderWithProviders(<Register />);

    // Fill in the form
    await user.type(screen.getByLabelText(/username/i), 'existinguser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Ensure navigation didn't happen
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('disables the button during submission', async () => {
    // Mock registration with a delay to test the loading state
    server.use(
      rest.post(`${baseUrl}/auth/register`, async (req, res, ctx) => {
        // Add a delay to simulate network latency
        await new Promise(resolve => setTimeout(resolve, 100));
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            message: 'Registration successful. Please check your email to verify your account.'
          })
        );
      })
    );

    renderWithProviders(<Register />);

    // Fill in the form
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /register/i }));

    // Check if the button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /registering/i })).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('navigates to login page when clicking login link', async () => {
    renderWithProviders(<Register />);
    
    // Click on the login link
    await user.click(screen.getByRole('link', { name: /login/i }));
    
    // Since we're using a mocked router, check the navigation
    expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
  });
});