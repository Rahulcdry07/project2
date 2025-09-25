import '@testing-library/jest-dom';
import { setupMockFetch, cleanupMockFetch } from './test-utils/mockAPI';

// Setup API mocking before tests
beforeAll(() => {
  // Setup basic mock fetch - individual tests can override as needed
  setupMockFetch();
});

// Cleanup between tests to ensure clean state
afterEach(() => {
  // Clear any custom mocks that tests might have set up
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
});

// Cleanup after all tests
afterAll(() => {
  cleanupMockFetch();
});

// Mock window.location
delete window.location;
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
  },
  writable: true,
});

// Set the base URL for fetch requests
global.REACT_APP_API_BASE_URL = 'http://localhost:3000/api';

// Mock window dialogs
window.confirm = jest.fn(() => true);
window.alert = jest.fn();

// Mock localStorage
const localStorageMock = (function() {
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
    }),
    length: 0,
    key: jest.fn(index => null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Set timeout for async operations
jest.setTimeout(10000);

// Mock window.matchMedia which is used in some components but not available in JSDOM
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};