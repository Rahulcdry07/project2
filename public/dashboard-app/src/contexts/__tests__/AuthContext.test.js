import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock API calls
jest.mock('../../services/api', () => ({
  authAPI: {
    validateToken: jest.fn(),
    login: jest.fn(),
    logout: jest.fn()
  }
}));

// Test component that consumes auth context
const TestComponent = () => {
  const auth = React.useContext(AuthContext);
  return (
    <div>
      <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="loading">{auth.loading.toString()}</div>
      <div data-testid="user">{JSON.stringify(auth.user)}</div>
      <button onClick={() => auth.login('testuser', 'password123')}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button onClick={() => auth.updateUser({ id: 1, username: 'updated' })}>Update User</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear mocks and localStorage before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test('provides initial context values', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  test('attempts to validate token on mount if token exists', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    const mockToken = 'valid-token';
    
    // Set token in localStorage
    localStorageMock.setItem('token', mockToken);
    
    // Mock successful token validation
    authAPI.validateToken.mockResolvedValue({
      success: true,
      data: mockUser
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially loading is true
    expect(screen.getByTestId('loading').textContent).toBe('true');

    // Wait for validation to complete
    await waitFor(() => {
      expect(authAPI.validateToken).toHaveBeenCalledWith(mockToken);
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(JSON.parse(screen.getByTestId('user').textContent)).toEqual(mockUser);
    });
  });

  test('handles invalid token on mount', async () => {
    // Set invalid token in localStorage
    localStorageMock.setItem('token', 'invalid-token');
    
    // Mock failed token validation
    authAPI.validateToken.mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for validation to complete
    await waitFor(() => {
      expect(authAPI.validateToken).toHaveBeenCalled();
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });

  test('handles login success', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    const mockToken = 'new-token';
    
    // Mock successful login
    authAPI.login.mockResolvedValue({
      success: true,
      data: {
        user: mockUser,
        token: mockToken
      }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Trigger login
    act(() => {
      screen.getByRole('button', { name: /login/i }).click();
    });

    // Wait for login to complete
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith('testuser', 'password123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
      expect(JSON.parse(screen.getByTestId('user').textContent)).toEqual(mockUser);
    });
  });

  test('handles login failure', async () => {
    // Mock failed login
    authAPI.login.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Trigger login
    act(() => {
      screen.getByRole('button', { name: /login/i }).click();
    });

    // Wait for login attempt to complete
    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith('testuser', 'password123');
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  test('handles logout', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    
    // Set up authenticated state
    authAPI.validateToken.mockResolvedValue({
      success: true,
      data: mockUser
    });
    localStorageMock.setItem('token', 'valid-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
    });

    // Trigger logout
    act(() => {
      screen.getByRole('button', { name: /logout/i }).click();
    });

    // Wait for logout to complete
    await waitFor(() => {
      expect(authAPI.logout).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });

  test('updates user information', async () => {
    const initialUser = { id: 1, username: 'testuser' };
    const updatedUser = { id: 1, username: 'updated' };
    
    // Set up authenticated state
    authAPI.validateToken.mockResolvedValue({
      success: true,
      data: initialUser
    });
    localStorageMock.setItem('token', 'valid-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial authentication to complete
    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId('user').textContent)).toEqual(initialUser);
    });

    // Trigger user update
    act(() => {
      screen.getByRole('button', { name: /update user/i }).click();
    });

    // Check if user is updated
    await waitFor(() => {
      expect(JSON.parse(screen.getByTestId('user').textContent)).toEqual(updatedUser);
    });
  });
});