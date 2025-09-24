import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Enable API mocking before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset any request handlers between tests
afterEach(() => server.resetHandlers());

// Disable API mocking after the tests
afterAll(() => server.close());

// Mock window.location
delete window.location;
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: jest.fn(),
    reload: jest.fn(),
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

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