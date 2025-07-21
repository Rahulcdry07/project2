import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../Navbar';
import { AuthContext } from '../../AuthContext';

function renderWithAuth(ui, { user, isLoggedIn = true, isLoading = false } = {}) {
  return render(
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading }}>
      {ui}
    </AuthContext.Provider>
  );
}

describe('Navbar initials avatar', () => {
  it('renders initials avatar with correct initials for username', () => {
    const user = { username: 'Jane Doe', email: 'jane@example.com' };
    renderWithAuth(<Navbar />, { user });
    expect(screen.getByText('JD')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders initials avatar with correct initial for email if username is missing', () => {
    const user = { username: '', email: 'bob@example.com' };
    renderWithAuth(<Navbar />, { user });
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders default icon if no user', () => {
    renderWithAuth(<Navbar />, { user: null });
    expect(screen.getByRole('button')).toBeInTheDocument();
    // Should show the default icon (bi-person), but we can't check SVG, so just ensure no initials
    expect(screen.queryByText(/^[A-Z]{1,2}$/)).not.toBeInTheDocument();
  });

  it('does not render an <img> for the avatar', () => {
    const user = { username: 'Test User', email: 'test@example.com' };
    renderWithAuth(<Navbar />, { user });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
}); 