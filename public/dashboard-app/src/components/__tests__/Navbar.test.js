import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Navbar Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
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
    loading: false,
    logout: jest.fn()
  };

  const mockUnauthenticatedContext = {
    user: null,
    isAuthenticated: false,
    loading: false,
    logout: jest.fn()
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders unauthenticated navbar correctly', () => {
    render(
      <AuthContext.Provider value={mockUnauthenticatedContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check if logo/brand is displayed
    expect(screen.getByText(/dashboard app/i)).toBeInTheDocument();
    
    // Check if login and register links are displayed
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
    
    // Check that authenticated-only links are not displayed
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/profile/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
  });

  test('renders authenticated navbar correctly', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check if logo/brand is displayed
    expect(screen.getByText(/dashboard app/i)).toBeInTheDocument();
    
    // Check if authenticated links are displayed
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/profile/i)).toBeInTheDocument();
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
    
    // Check that unauthenticated-only links are not displayed
    expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
    
    // Check that admin-only links are not displayed for regular user
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
  });

  test('renders admin navbar with admin link', () => {
    render(
      <AuthContext.Provider value={{ ...mockAuthContext, user: mockAdminUser }}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check if admin link is displayed for admin user
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  test('displays username in navbar', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Check if username is displayed
    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
  });

  test('calls logout when logout link is clicked', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Find and click logout link
    fireEvent.click(screen.getByText(/logout/i));
    
    // Check if logout was called
    expect(mockAuthContext.logout).toHaveBeenCalled();
  });

  test('navigates to login page when login link is clicked', () => {
    render(
      <AuthContext.Provider value={mockUnauthenticatedContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Find and click login link
    fireEvent.click(screen.getByText(/login/i));
    
    // Check if navigation was triggered
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('navigates to register page when register link is clicked', () => {
    render(
      <AuthContext.Provider value={mockUnauthenticatedContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Find and click register link
    fireEvent.click(screen.getByText(/register/i));
    
    // Check if navigation was triggered
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  test('navigates to dashboard page when dashboard link is clicked', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Find and click dashboard link
    fireEvent.click(screen.getByText(/dashboard/i));
    
    // Check if navigation was triggered
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('navigates to profile page when profile link is clicked', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Find and click profile link
    fireEvent.click(screen.getByText(/profile/i));
    
    // Check if navigation was triggered
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  test('navigates to admin page when admin link is clicked', () => {
    render(
      <AuthContext.Provider value={{ ...mockAuthContext, user: mockAdminUser }}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Find and click admin link
    fireEvent.click(screen.getByText(/admin/i));
    
    // Check if navigation was triggered
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  test('handles mobile navigation toggle', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Find and click the toggle button
    const toggleButton = screen.getByRole('button', { name: /toggle navigation/i });
    
    // Check initial state (should be collapsed)
    const navbarCollapse = document.querySelector('.navbar-collapse');
    expect(navbarCollapse).not.toHaveClass('show');
    
    // Click to expand
    fireEvent.click(toggleButton);
    
    // Should now be expanded
    expect(navbarCollapse).toHaveClass('show');
    
    // Click again to collapse
    fireEvent.click(toggleButton);
    
    // Should be collapsed again
    expect(navbarCollapse).not.toHaveClass('show');
  });

  test('shows loading state', () => {
    render(
      <AuthContext.Provider value={{ ...mockUnauthenticatedContext, loading: true }}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // During loading, the navbar should not show auth-specific links
    expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/register/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
    
    // Should only show brand
    expect(screen.getByText(/dashboard app/i)).toBeInTheDocument();
  });
});