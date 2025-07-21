import React from 'react';
import { render, screen, act } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';

beforeEach(() => {
  localStorage.setItem('token', 'test-token');
  jest.spyOn(window, 'fetch').mockImplementation((url) => {
    if (url === '/api/profile') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ username: 'testuser', role: 'user' }),
      });
    }
    return Promise.resolve({ json: () => Promise.resolve({}) });
  });
});

afterEach(() => {
  localStorage.removeItem('token');
  window.fetch.mockRestore();
});

test('renders Dashboard for logged-in user', async () => {
  await act(async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
  });
  const linkElement = await screen.findByText((content, node) => {
    const hasText = (node) => node.textContent === 'Welcome to your dashboard, testuser!';
    const nodeHasText = hasText(node);
    const childrenDontHaveText = Array.from(node.children).every(
      (child) => !hasText(child)
    );

    return nodeHasText && childrenDontHaveText;
  });
  expect(linkElement).toBeInTheDocument();
});