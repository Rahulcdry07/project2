import React from 'react';
import { render, screen, act } from '@testing-library/react';
import App from './App';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true, stats: { total_users: 10, new_registrations_today: 2, online_users: 5 }, activities: [] }),
  })
);

test('renders Welcome Back message', async () => {
  await act(async () => {
    render(<App />);
  });
  const linkElement = screen.getByText(/Welcome Back/i);
  expect(linkElement).toBeInTheDocument();
});