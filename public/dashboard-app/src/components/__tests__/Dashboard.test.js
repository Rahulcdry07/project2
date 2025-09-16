import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import Dashboard from '../Dashboard';

// Create a mock AuthContext since the real one might be causing issues
const mockAuthContext = {
  Provider: ({ children, value }) => {
    return <div data-testid="auth-provider">{children}</div>;
  }
};

// Mock the actual module
jest.mock('../../contexts/AuthContext', () => ({
  AuthContext: {
    Provider: ({ children, value }) => {
      return <div data-testid="auth-provider">{children}</div>;
    }
  }
}));

// Mock the API
jest.mock('../../services/api', () => {
  return {
    dashboardAPI: {
      getDashboardData: jest.fn(() => Promise.resolve({
        success: true,
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
      }))
    }
  };
});

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}));

describe('Dashboard Component', () => {
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

  const mockAuthValue = {
    user: mockUser,
    isAuthenticated: true,
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard component', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    // Basic test to see if the component renders at all
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
  });
});

describe('Dashboard Component', () => {
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

  const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    loading: false
  };

  test('renders dashboard for regular user', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </AuthContext.Provider>
    );

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
    }, { timeout: 1000 });

    // Admin section should not be visible for regular users
    expect(screen.queryByText(/admin tools/i)).not.toBeInTheDocument();
  });

  test('renders admin section for admin users', async () => {
    render(
      <AuthContext.Provider value={{ ...mockAuthContext, user: mockAdminUser }}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Wait for data to load
    await waitFor(() => {
      // Check for welcome message with admin indication
      expect(screen.getByText(/welcome, test/i)).toBeInTheDocument();
      
      // Admin section should be visible
      expect(screen.getByText(/admin tools/i)).toBeInTheDocument();
      expect(screen.getByText(/manage users/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('handles error when loading dashboard data', async () => {
    // Override the mock to return an error for this specific test
    const { dashboardAPI } = require('../../services/api');
    dashboardAPI.getDashboardData.mockRejectedValueOnce(new Error('Failed to load dashboard data'));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard data/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('redirects unauthenticated users', () => {
    const unauthenticatedContext = {
      ...mockAuthContext,
      isAuthenticated: false
    };

    // Mock navigate directly instead of mocking the entire module
    const mockNavigate = jest.fn();
    
    // Override the useNavigate for this specific test
    jest.spyOn(require('react-router-dom'), 'useNavigate').mockImplementation(() => mockNavigate);

    render(
      <AuthContext.Provider value={unauthenticatedContext}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // No need for waitFor as this is synchronous redirection in componentDidMount/useEffect
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    
    // Clean up the mock after test
    jest.restoreAllMocks();
  });
});