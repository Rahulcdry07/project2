import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { setupMockFetch } from './test-utils/mockAPI';

/**
 * Custom render function that includes common providers
 * This allows us to wrap each component in the necessary providers without duplicating code
 */
const customRender = (ui, options = {}) => {
  const AllProviders = ({ children }) => {
    return (
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: AllProviders, ...options });
};

/**
 * Alternative render function for tests that need control over routing
 */
export const renderWithProviders = (ui, options = {}) => {
  const { initialEntries = ['/'], mockFetchResponses, ...renderOptions } = options;
  
  // Setup custom mock fetch if provided
  if (mockFetchResponses) {
    setupMockFetch(mockFetchResponses);
  }
  
  const AllProviders = ({ children }) => {
    return (
      <MemoryRouter 
        initialEntries={initialEntries}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </MemoryRouter>
    );
  };

  return render(ui, { wrapper: AllProviders, ...renderOptions });
};

/**
 * Helper function to create mock auth context values
 */
export const createMockAuthContext = ({
  user = null,
  isAuthenticated = false,
  isLoading = false,
  error = null
} = {}) => ({
  currentUser: user,
  loading: isLoading,
  error,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  updateUser: jest.fn()
});

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render method
export { customRender as render };