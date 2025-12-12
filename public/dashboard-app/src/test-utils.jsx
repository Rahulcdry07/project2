import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { vi } from 'vitest';
import PropTypes from 'prop-types';

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
  
  AllProviders.propTypes = {
    children: PropTypes.node.isRequired
  };

  return render(ui, { wrapper: AllProviders, ...options });
};

/**
 * Alternative render function for tests that need control over routing
 */
export const renderWithProviders = (ui, options = {}) => {
  const { initialEntries = ['/'], routerType = 'memory', ...renderOptions } = options;
  
  const AllProviders = ({ children }) => {
    const RouterComponent = routerType === 'memory' ? MemoryRouter : BrowserRouter;
    const routerProps = routerType === 'memory' ? {
      initialEntries,
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    } : {};

    return (
      <RouterComponent {...routerProps}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </RouterComponent>
    );
  };
  
  AllProviders.propTypes = {
    children: PropTypes.node.isRequired
  };

  return render(ui, { wrapper: AllProviders, ...renderOptions });
};

/**
 * Helper function to create mock auth context values
 */
export const createMockAuthContext = ({
  user = null,
  isLoading = false,
  error = null
} = {}) => ({
  currentUser: user,
  loading: isLoading,
  error,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  updateUser: vi.fn()
});

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render method
export { customRender as render };