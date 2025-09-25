import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from '../../Profile';
import { rest } from 'msw';
import { server, baseUrl } from '../../../mocks/server';
import { renderWithProviders } from '../../../test-utils';

// Mock the AuthContext
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  bio: 'Test bio'
};

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock the AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../../contexts/AuthContext'),
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    loading: false,
    logout: jest.fn(),
    updateUser: jest.fn()
  })
}));

describe('Profile Component', () => {
  let user;
  
  beforeEach(() => {
    // Setup userEvent
    user = userEvent.setup();
    // Reset MSW handlers
    server.resetHandlers();
    
    // Set up default profile endpoint
    server.use(
      rest.get(`${baseUrl}/profile`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: mockUser
          })
        );
      })
    );
  });

  test('renders profile form with user data', async () => {
    renderWithProviders(<Profile />);

    // Wait for the profile data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue(mockUser.firstName);
      expect(screen.getByLabelText(/last name/i)).toHaveValue(mockUser.lastName);
      expect(screen.getByLabelText(/bio/i)).toHaveValue(mockUser.bio);
      expect(screen.getByLabelText(/username/i)).toHaveValue(mockUser.username);
      expect(screen.getByLabelText(/email/i)).toHaveValue(mockUser.email);
    });

    // Check if the important elements are in the document
    expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
  });

  test('handles form submission successfully', async () => {
    const updatedUser = {
      ...mockUser,
      firstName: 'Updated',
      lastName: 'Name',
      bio: 'Updated bio'
    };

    // Mock successful profile update
    server.use(
      rest.put(`${baseUrl}/profile`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: updatedUser,
            message: 'Profile updated successfully'
          })
        );
      })
    );

    // Get the updateUser function from the mocked context
    const { useAuth } = require('../../../contexts/AuthContext');
    const { updateUser } = useAuth();

    renderWithProviders(<Profile />);

    // Wait for the profile data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Update form fields
    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Updated');
    
    await user.clear(screen.getByLabelText(/last name/i));
    await user.type(screen.getByLabelText(/last name/i), 'Name');
    
    await user.clear(screen.getByLabelText(/bio/i));
    await user.type(screen.getByLabelText(/bio/i), 'Updated bio');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for the update to complete
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      expect(updateUser).toHaveBeenCalledWith(updatedUser);
    });
  });

  test('validates form inputs', async () => {
    renderWithProviders(<Profile />);

    // Wait for the profile data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Clear required fields
    await user.clear(screen.getByLabelText(/first name/i));
    await user.clear(screen.getByLabelText(/last name/i));
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    });
  });

  test('handles profile update error', async () => {
    // Mock failed profile update
    const errorMessage = 'Failed to update profile';
    server.use(
      rest.put(`${baseUrl}/profile`, (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            status: 'error',
            message: errorMessage
          })
        );
      })
    );

    renderWithProviders(<Profile />);

    // Wait for the profile data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Update form fields
    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Updated');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('disables the button during submission', async () => {
    // Mock profile update with delay
    server.use(
      rest.put(`${baseUrl}/profile`, async (req, res, ctx) => {
        // Add a delay to simulate network latency
        await new Promise(resolve => setTimeout(resolve, 100));
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: mockUser,
            message: 'Profile updated successfully'
          })
        );
      })
    );

    renderWithProviders(<Profile />);

    // Wait for the profile data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Update form fields
    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Updated');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /update profile/i }));

    // Check if the button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  test('handles profile fetch error', async () => {
    // Mock failed profile fetch
    server.use(
      rest.get(`${baseUrl}/profile`, (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            status: 'error',
            message: 'Failed to fetch profile'
          })
        );
      })
    );

    renderWithProviders(<Profile />);

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch profile/i)).toBeInTheDocument();
    });
  });
});