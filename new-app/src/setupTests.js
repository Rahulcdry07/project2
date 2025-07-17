import '@testing-library/jest-dom';

delete window.location;
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    assign: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

window.confirm = jest.fn(() => true);
window.alert = jest.fn();