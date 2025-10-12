import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the API services to avoid MSW ES module issues
vi.mock('./services/api');

// Mock window.location - handle it more carefully for Vitest
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
    assign: vi.fn(),
    reload: vi.fn(),
    replace: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Set the base URL for fetch requests
global.REACT_APP_API_BASE_URL = 'http://localhost:3000/api';

// Mock window dialogs
window.confirm = vi.fn(() => true);
window.alert = vi.fn();

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    length: 0,
    key: vi.fn(() => null)
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.matchMedia which is used in some components but not available in JSDOM
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
};