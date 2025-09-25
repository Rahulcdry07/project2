import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import Profile from '../Profile';

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

describe('Profile Component', () => {
  let user;
  
  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
    mockNavigate.mockClear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    global.fetch.mockClear();
  });

  test('renders profile form correctly when user is authenticated', async () => {
    // Setup authenticated state
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ username: 'testuser', email: 'test@example.com' })
    });

    renderWithProviders(<Profile />);

    // Check if profile elements are rendered
    expect(screen.getByRole('heading', { name: /your profile/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    // Verify API call was made
    expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
      headers: { 'Authorization': 'Bearer valid-token' }
    });
  });

  test('redirects to login when no token is present', async () => {
    // Setup unauthenticated state
    mockLocalStorage.getItem.mockReturnValue(null);

    renderWithProviders(<Profile />);

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

    renderWithProviders(<Profile />);

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

  test('displays error message for API errors on load', async () => {
    // Setup API error
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Profile not found' })
    });

    renderWithProviders(<Profile />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/error: profile not found/i)).toBeInTheDocument();
    });

    // Should not redirect for non-auth errors
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('handles network error on profile load gracefully', async () => {
    // Setup network error
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<Profile />);

    // Wait for error handling
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/network error fetching profile/i)).toBeInTheDocument();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('updates profile successfully', async () => {
    // Setup initial profile load
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'olduser', email: 'old@example.com' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Profile updated successfully!' })
      });

    renderWithProviders(<Profile />);

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('olduser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('old@example.com')).toBeInTheDocument();
    });

    // Update the form
    await user.clear(screen.getByLabelText(/username/i));
    await user.type(screen.getByLabelText(/username/i), 'newuser');
    
    await user.clear(screen.getByLabelText(/email address/i));
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });

    // Verify API call was made with correct data
    expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token'
      },
      body: JSON.stringify({ username: 'newuser', email: 'new@example.com' }),
    });
  });

  test('handles profile update error', async () => {
    // Setup initial profile load
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'testuser', email: 'test@example.com' })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already in use' })
      });

    renderWithProviders(<Profile />);

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    });

    // Update the form
    await user.clear(screen.getByLabelText(/email address/i));
    await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/error: email already in use/i)).toBeInTheDocument();
    });
  });

  test('handles network error during profile update', async () => {
    // Setup initial profile load
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'testuser', email: 'test@example.com' })
      })
      .mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(<Profile />);

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    });

    // Submit the form
    await user.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/network error updating profile/i)).toBeInTheDocument();
    });
  });

  test('clears messages when starting new update', async () => {
    // Setup initial profile load with existing error
    mockLocalStorage.getItem.mockReturnValue('valid-token');
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ username: 'testuser', email: 'test@example.com' })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Some error' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Profile updated successfully!' })
      });

    renderWithProviders(<Profile />);

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    });

    // Submit the form to create an error
    await user.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/error: some error/i)).toBeInTheDocument();
    });

    // Submit again - should clear the error
    await user.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for success message (error should be cleared)
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      expect(screen.queryByText(/error: some error/i)).not.toBeInTheDocument();
    });
  });
});