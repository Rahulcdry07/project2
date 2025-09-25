import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './test-utils';
import App from './App';

// Mock the auth utils to simulate unauthenticated state
jest.mock('./utils/auth', () => ({
  isAuthenticated: jest.fn(() => false),
  isAdmin: jest.fn(() => false)
}));

describe('App', () => {
  test('redirects to login when unauthenticated', () => {
    renderWithProviders(<App />, { initialEntries: ['/'] });
    
    // Since user is not authenticated, should redirect to login
    // We can check for login form elements
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  test('renders app structure', () => {
    renderWithProviders(<App />, { initialEntries: ['/login'] });
    
    // Should have the basic app structure
    const loginElement = screen.getByText(/login/i);
    expect(loginElement).toBeInTheDocument();
  });
});