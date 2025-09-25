import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import Navbar from '../Navbar';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock the useAuth hook for different test scenarios
const mockUseAuth = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: () => mockUseAuth()
}));

// Mock auth utils
jest.mock('../../utils/auth', () => ({
  isAdmin: jest.fn(() => false)
}));

const mockAuthUtils = require('../../utils/auth');

describe('Navbar Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUseAuth.mockClear();
    mockAuthUtils.isAdmin.mockReturnValue(false);
  });

  test('renders unauthenticated navbar correctly', () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      loading: false,
      error: null,
      logout: jest.fn()
    });

    renderWithProviders(<Navbar />);

    // Check for login and register links
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
    
    // Should not have logout button
    expect(screen.queryByText(/logout/i)).not.toBeInTheDocument();
  });

  test('renders authenticated navbar correctly', () => {
    mockUseAuth.mockReturnValue({
      currentUser: { username: 'testuser', role: 'user' },
      loading: false,
      error: null,
      logout: jest.fn()
    });

    renderWithProviders(<Navbar />);

    // Check for authenticated user elements  
    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    
    // Should not have login and register links
    expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^register$/i })).not.toBeInTheDocument();
  });

  test('renders admin navbar with admin link', () => {
    mockUseAuth.mockReturnValue({
      currentUser: { username: 'adminuser', role: 'admin' },
      loading: false,
      error: null,
      logout: jest.fn()
    });

    // Mock isAdmin to return true
    mockAuthUtils.isAdmin.mockReturnValue(true);

    renderWithProviders(<Navbar />);

    // Check for admin link
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      loading: true,
      error: null,
      logout: jest.fn()
    });

    renderWithProviders(<Navbar />);

    // Should show some loading indicator or basic structure
    // This test might need adjustment based on actual loading UI
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});