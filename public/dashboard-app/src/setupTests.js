import '@testing-library/jest-dom';

// Mock window.location
delete window.location;
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

// Mock window dialogs
window.confirm = jest.fn(() => true);
window.alert = jest.fn();

// Mock out global fetch to prevent hanging tests
beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => 
    Promise.resolve({
      json: () => Promise.resolve({}),
      ok: true
    })
  );
  
  // Set timeout for async operations
  jest.setTimeout(10000);
});

afterEach(() => {
  // Restore all mocks between tests
  jest.restoreAllMocks();
});

// Mock window.matchMedia which is used in some components but not available in JSDOM
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};