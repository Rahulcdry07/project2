import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Admin from '../Admin';
import { rest } from 'msw';
import { server, baseUrl } from '../../mocks/server';
import { renderWithProviders } from '../../test-utils';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock the AuthContext
const mockUsers = [
  { id: 1, username: 'user1', email: 'user1@example.com', role: 'user' },
  { id: 2, username: 'user2', email: 'user2@example.com', role: 'user' },
  { id: 3, username: 'admin', email: 'admin@example.com', role: 'admin' }
];

const mockAdminUser = {
  id: 100,
  username: 'testadmin',
  email: 'testadmin@example.com',
  role: 'admin'
};

const mockRegularUser = {
  id: 101,
  username: 'testuser',
  email: 'testuser@example.com',
  role: 'user'
};

// Mock different auth states
jest.mock('../../contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../contexts/AuthContext');
  
  return {
    ...originalModule,
    useAuth: jest.fn()
  };
});

describe('Admin Component', () => {
  let user;
  
  beforeEach(() => {
    // Setup userEvent
    user = userEvent.setup();
    // Reset MSW handlers
    server.resetHandlers();
    // Reset navigate mock
    mockNavigate.mockReset();
    
    // Default mock for fetching users
    server.use(
      rest.get(`${baseUrl}/admin/users`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: mockUsers
          })
        );
      }),
      
      // Default mock for getting user by ID
      rest.get(`${baseUrl}/admin/users/:userId`, (req, res, ctx) => {
        const { userId } = req.params;
        const user = mockUsers.find(u => u.id === parseInt(userId));
        
        if (user) {
          return res(
            ctx.status(200),
            ctx.json({
              status: 'success',
              data: user
            })
          );
        }
        
        return res(
          ctx.status(404),
          ctx.json({
            status: 'error',
            message: 'User not found'
          })
        );
      })
    );
  });

  test('redirects non-admin users to dashboard', async () => {
    // Set up auth context with regular user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockRegularUser,
      isAuthenticated: true,
      loading: false
    });

    renderWithProviders(<Admin />);

    // Expect redirect to dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('renders admin dashboard with user list', async () => {
    // Set up auth context with admin user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      loading: false
    });

    renderWithProviders(<Admin />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user management/i)).toBeInTheDocument();
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
      expect(screen.getByText(/user2/i)).toBeInTheDocument();
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
      
      // Check table headers
      expect(screen.getByText(/username/i)).toBeInTheDocument();
      expect(screen.getByText(/email/i)).toBeInTheDocument();
      expect(screen.getByText(/role/i)).toBeInTheDocument();
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });
  });

  test('opens edit user modal with user data', async () => {
    // Set up auth context with admin user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      loading: false
    });

    renderWithProviders(<Admin />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the edit button for the first user
    const editButtons = screen.getAllByText(/edit/i);
    await user.click(editButtons[0]);

    // Wait for modal to open and user data to load
    await waitFor(() => {
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
      
      // Check form fields
      expect(screen.getByLabelText(/username/i)).toHaveValue('user1');
      expect(screen.getByLabelText(/email/i)).toHaveValue('user1@example.com');
      expect(screen.getByLabelText(/role/i)).toHaveValue('user');
    });
  });

  test('updates user role successfully', async () => {
    // Set up auth context with admin user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      loading: false
    });

    // Mock user update endpoint
    server.use(
      rest.put(`${baseUrl}/admin/users/:userId`, (req, res, ctx) => {
        const { userId } = req.params;
        const updatedUser = { ...mockUsers[0], role: 'admin' };
        
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: updatedUser,
            message: 'User updated successfully'
          })
        );
      })
    );

    renderWithProviders(<Admin />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the edit button for the first user
    const editButtons = screen.getAllByText(/edit/i);
    await user.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
    });

    // Change role to admin
    await user.selectOptions(screen.getByLabelText(/role/i), 'admin');
    
    // Submit the form
    await user.click(screen.getByText(/save changes/i));

    // Wait for update to complete
    await waitFor(() => {
      expect(screen.getByText(/user updated successfully/i)).toBeInTheDocument();
      
      // Modal should close
      expect(screen.queryByText(/edit user/i)).not.toBeInTheDocument();
    });
  });

  test('confirms and deletes user', async () => {
    // Set up auth context with admin user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      loading: false
    });

    // Mock delete user endpoint
    server.use(
      rest.delete(`${baseUrl}/admin/users/:userId`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            message: 'User deleted successfully'
          })
        );
      })
    );

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    renderWithProviders(<Admin />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the delete button for the first user
    const deleteButtons = screen.getAllByText(/delete/i);
    await user.click(deleteButtons[0]);

    // Wait for deletion to complete
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(screen.getByText(/user deleted successfully/i)).toBeInTheDocument();
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  test('handles user fetch error', async () => {
    // Set up auth context with admin user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      loading: false
    });

    // Mock failed users fetch
    server.use(
      rest.get(`${baseUrl}/admin/users`, (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            status: 'error',
            message: 'Failed to fetch users'
          })
        );
      })
    );

    renderWithProviders(<Admin />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch users/i)).toBeInTheDocument();
    });
  });

  test('handles user update error', async () => {
    // Set up auth context with admin user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      loading: false
    });

    // Mock failed user update
    server.use(
      rest.put(`${baseUrl}/admin/users/:userId`, (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            status: 'error',
            message: 'Failed to update user'
          })
        );
      })
    );

    renderWithProviders(<Admin />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the edit button for the first user
    const editButtons = screen.getAllByText(/edit/i);
    await user.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
    });

    // Change role to admin
    await user.selectOptions(screen.getByLabelText(/role/i), 'admin');
    
    // Submit the form
    await user.click(screen.getByText(/save changes/i));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to update user/i)).toBeInTheDocument();
    });
  });

  test('cancels delete when confirmation is declined', async () => {
    // Set up auth context with admin user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      loading: false
    });

    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => false);
    
    // Create a spy for the delete endpoint to ensure it's not called
    let deleteWasCalled = false;
    server.use(
      rest.delete(`${baseUrl}/admin/users/:userId`, (req, res, ctx) => {
        deleteWasCalled = true;
        return res(ctx.status(200));
      })
    );

    renderWithProviders(<Admin />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the delete button for the first user
    const deleteButtons = screen.getAllByText(/delete/i);
    await user.click(deleteButtons[0]);

    // Confirm that delete was not called
    expect(window.confirm).toHaveBeenCalled();
    expect(deleteWasCalled).toBe(false);

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  test('closes edit modal on cancel', async () => {
    // Set up auth context with admin user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      loading: false
    });

    renderWithProviders(<Admin />);

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the edit button for the first user
    const editButtons = screen.getAllByText(/edit/i);
    await user.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
    });

    // Click cancel button
    await user.click(screen.getByText(/cancel/i));

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText(/edit user/i)).not.toBeInTheDocument();
    });
  });
});