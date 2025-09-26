import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { rest } from 'msw';
import { server, baseUrl } from '../../mocks/server';
import { renderWithProviders } from '../../test-utils';

// Mock the AuthContext
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user'
};

const mockAdminUser = {
  ...mockUser,
  role: 'admin'
};

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock different auth states
jest.mock('../../contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../contexts/AuthContext');
  
  return {
    ...originalModule,
    useAuth: jest.fn()
  };
});

describe('Dashboard Component', () => {
  let user;
  
  beforeEach(() => {
    // Setup userEvent
    user = userEvent.setup();
    // Reset MSW handlers
    server.resetHandlers();
    // Reset navigate mock
    mockNavigate.mockReset();
    
    // Default mock dashboard data
    server.use(
      rest.get(`${baseUrl}/dashboard`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            status: 'success',
            data: {
              stats: {
                userCount: 120,
                activeUsers: 87,
                totalPosts: 450,
                newUsersToday: 5
              },
              recentActivity: [
                { id: 1, action: 'User Login', user: 'user1', timestamp: '2023-07-10T10:30:00Z' },
                { id: 2, action: 'Profile Update', user: 'user2', timestamp: '2023-07-10T09:45:00Z' },
                { id: 3, action: 'Post Created', user: 'user3', timestamp: '2023-07-10T08:15:00Z' }
              ]
            }
          })
        );
      })
    );
  });

  test('renders dashboard for regular user', async () => {
    // Set up auth context with regular user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false
    });

    renderWithProviders(<Dashboard />);

    // Check for loading state initially
    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      // Check for welcome message
      expect(screen.getByText(/welcome, test/i)).toBeInTheDocument();
      
      // Check for dashboard statistics
      expect(screen.getByText(/120/)).toBeInTheDocument(); // userCount
      expect(screen.getByText(/87/)).toBeInTheDocument(); // activeUsers
      expect(screen.getByText(/450/)).toBeInTheDocument(); // totalPosts
      expect(screen.getByText(/5/)).toBeInTheDocument(); // newUsersToday
      
      // Check for recent activity section
      expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
      expect(screen.getByText(/user login/i)).toBeInTheDocument();
      expect(screen.getByText(/profile update/i)).toBeInTheDocument();
      expect(screen.getByText(/post created/i)).toBeInTheDocument();
    });

    // Admin section should not be visible for regular users
    expect(screen.queryByText(/admin tools/i)).not.toBeInTheDocument();
  });

  test('renders admin section for admin users', async () => {
    // Set up auth context with admin user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      loading: false
    });

    renderWithProviders(<Dashboard />);

    // Wait for data to load
    await waitFor(() => {
      // Check for welcome message with admin role
      expect(screen.getByText(/welcome, test/i)).toBeInTheDocument();
      
      // Admin section should be visible
      expect(screen.getByText(/admin tools/i)).toBeInTheDocument();
      expect(screen.getByText(/manage users/i)).toBeInTheDocument();
    });
  });

  test('handles error when loading dashboard data', async () => {
    // Set up auth context with regular user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      loading: false
    });

    // Mock failed dashboard data fetch
    server.use(
      rest.get(`${baseUrl}/dashboard`, (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            status: 'error',
            message: 'Failed to load dashboard data'
          })
        );
      })
    );

    renderWithProviders(<Dashboard />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard data/i)).toBeInTheDocument();
    });
  });

  test('redirects unauthenticated users to login', async () => {
    // Set up auth context with unauthenticated user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false
    });

    renderWithProviders(<Dashboard />);

    // Verify navigation to login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('admin user can navigate to admin page', async () => {
    // Set up auth context with admin user
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: mockAdminUser,
      isAuthenticated: true,
      loading: false
    });

    renderWithProviders(<Dashboard />);

    // Wait for data to load and admin section to appear
    await waitFor(() => {
      expect(screen.getByText(/admin tools/i)).toBeInTheDocument();
    });

    // Click on the admin link
    await user.click(screen.getByText(/manage users/i));

    // Verify navigation to admin page
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  test('shows loading state when auth is loading', async () => {
    // Set up auth context with loading state
    const { useAuth } = require('../../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: true
    });

    renderWithProviders(<Dashboard />);

    // Should show auth loading state
    expect(screen.getByText(/loading authentication/i)).toBeInTheDocument();
  });
});