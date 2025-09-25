import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the auth utilities
jest.mock('../../utils/auth', () => ({
  getToken: jest.fn(() => null),
  getCurrentUser: jest.fn(() => null),
  setAuthData: jest.fn(),
  clearAuthData: jest.fn()
}));

// Mock the API
jest.mock('../../services/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn()
  }
}));

// Simple test without MSW to isolate issues
describe('AuthContext - Basic Tests', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
  
  test('provides default auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.currentUser).toBeNull();
    expect(result.current.loading).toBe(false); // Should be false after initialization
    expect(result.current.error).toBeNull();
  });
  
  test('login function exists', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.updateUser).toBe('function');
  });
  
  test('handles logout correctly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.currentUser).toBeNull();
    expect(result.current.error).toBeNull();
  });
});