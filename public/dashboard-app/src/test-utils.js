import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

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

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render method
export { customRender as render };