import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Register from './components/Register';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock react-router-dom's useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('Register Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock the fetch API
    global.fetch = jest.fn(async (url, options) => {
      if (url === 'http://localhost:3000/api/register') {
        const body = JSON.parse(options.body);
        if (body.username === 'testuser' && body.email === 'test@example.com' && body.password === 'StrongP@ss1') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Registration successful. Please check your email to verify your account.' }),
          });
        } else if (body.username === 'existinguser') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Username already exists.' }),
          });
        } else if (body.email === 'existing@example.com') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Email already exists.' }),
          });
        }
      }
      return Promise.reject(new Error('not found'));
    });
  });

  test('renders registration form', () => {
    render(
      <Router>
        <Register />
      </Router>
    );

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('shows error message if fields are empty on submit', async () => {
    render(
      <Router>
        <Register />
      </Router>
    );

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/all fields are required./i)).toBeInTheDocument();
    });
  });

  test('shows error message for invalid email format', async () => {
    render(
      <Router>
        <Register />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'invalid-email' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'StrongP@ss1' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address./i)).toBeInTheDocument();
    });
  });

  test('shows error message for weak password', async () => {
    render(
      <Router>
        <Register />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'weak' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character \(@\$\!%\*\?\&\)./i)).toBeInTheDocument();
    });
  });

  test('handles successful registration', async () => {
    render(
      <Router>
        <Register />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'StrongP@ss1' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'testuser', email: 'test@example.com', password: 'StrongP@ss1' }),
        })
      );
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Registration successful. Please check your email to verify your account.');
    });

    await waitFor(() => {
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('handles registration failure due to existing username', async () => {
    render(
      <Router>
        <Register />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'StrongP@ss1' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/username already exists./i)).toBeInTheDocument();
    });
  });

  test('handles registration failure due to existing email', async () => {
    render(
      <Router>
        <Register />
      </Router>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'StrongP@ss1' } });

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists./i)).toBeInTheDocument();
    });
  });
});
