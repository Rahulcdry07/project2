import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
    this.observe = jest.fn((element) => {
      // Simulate intersection immediately for testing
      setTimeout(() => {
        this.callback([{ isIntersecting: true, target: element }]);
      }, 0);
    });
    this.unobserve = jest.fn();
    this.disconnect = jest.fn();
  }
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
  return 1;
};

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

// Mock window.pageYOffset
Object.defineProperty(window, 'pageYOffset', {
  value: 0,
  writable: true
});

// Mock setInterval and clearInterval
global.setInterval = jest.fn((callback, delay) => {
  const id = setTimeout(callback, delay);
  return id;
});
global.clearInterval = jest.fn((id) => {
  clearTimeout(id);
});

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.alert
global.alert = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Original setupTests.js content
delete window.location;
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    origin: 'http://localhost',
    href: 'http://localhost/',
    assign: jest.fn(),
    reload: jest.fn(),
  },
});

window.confirm = jest.fn(() => true);