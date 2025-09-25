import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import Dashboard from '../Dashboard';

// Mock the auth utilities
jest.mock('../../utils/auth', () => ({
  setAuthData: jest.fn(),
  getToken: jest.fn(),
  getCurrentUser: jest.fn(),
  clearAuthData: jest.fn(),
  isValidEmail: jest.fn((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock the react-router-dom useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock fetch
global.fetch = jest.fn();

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    global.fetch.mockClear();
  });

  test('renders dashboard correctly when user is authenticated', async () => {
    // Setup authenticated state
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ username: 'testuser', email: 'test@example.com' })
    });

    renderWithProviders(<Dashboard />);

    // Check if dashboard elements are rendered
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/welcome to your dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/more dashboard content will go here/i)).toBeInTheDocument();

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    // Verify API call was made
    expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
      headers: { 'Authorization': 'Bearer valid-token' }
    });
  });

  test('redirects to login when no token is present', async () => {
    // Setup unauthenticated state
    mockLocalStorage.getItem.mockReturnValue(null);

    renderWithProviders(<Dashboard />);

    // Should redirect to login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    // No API call should be made
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('redirects to login when token is expired', async () => {
    // Setup expired token state
    mockLocalStorage.getItem.mockReturnValue('expired-token');
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Token expired.' })
    });

    renderWithProviders(<Dashboard />);

    // Wait for API call and redirect
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
        headers: { 'Authorization': 'Bearer expired-token' }
      });
    });

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('redirects to login when token is invalid', async () => {
    // Setup invalid token state
    mockLocalStorage.getItem.mockReturnValue('invalid-token');
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid token.' })
    });

    renderWithProviders(<Dashboard />);

    // Wait for API call and redirect
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
    });

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('handles network error gracefully', async () => {
    // Setup network error
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<Dashboard />);

    // Wait for error handling
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
    });

    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('handles malformed API response', async () => {
    // Setup malformed response
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Something went wrong' })
    });

    renderWithProviders(<Dashboard />);

    // Dashboard should still render but without username
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/welcome to your dashboard/i)).toBeInTheDocument();

    // Wait for API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
    });

    // Should not redirect for non-auth errors
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('displays username in the correct element', async () => {
    // Setup authenticated state
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ username: 'johndoe', email: 'john@example.com' })
    });

    renderWithProviders(<Dashboard />);

    // Wait for user data to load and check it's in the correct element
    await waitFor(() => {
      const usernameElement = screen.getByText('johndoe');
      expect(usernameElement).toBeInTheDocument();
      expect(usernameElement.closest('#username')).toBeTruthy();
    });
  });
});