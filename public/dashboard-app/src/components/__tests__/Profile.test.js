import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Profile from '../Profile';
import { AuthContext } from '../../AuthContext';

const mockUser = {
  username: 'testuser',
  email: 'test@example.com',
  bio: 'Test bio',
  location: 'Test City',
  website: 'https://test.com',
  github_url: 'https://github.com/testuser',
  linkedin_url: 'https://linkedin.com/in/testuser',
  twitter_url: 'https://twitter.com/testuser',
  profile_privacy: 'public',
  profile_completion: 80,
  login_count: 5,
  last_login: '2024-07-21T03:59:08.729Z',
  is_verified: true,
};

function renderWithAuth(ui, { user = mockUser, isLoggedIn = true, isLoading = false } = {}) {
  return render(
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading }}>
      {ui}
    </AuthContext.Provider>
  );
}

describe('Profile page (no picture)', () => {
  it('does not render ProfilePicture', () => {
    renderWithAuth(<Profile />);
    // Should not find any image or upload button
    expect(screen.queryByLabelText(/profile picture/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText(/upload/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/remove/i)).not.toBeInTheDocument();
  });

  it('renders ProfileForm, ProfileStatsCard, and PasswordForm', () => {
    renderWithAuth(<Profile />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByText(/account statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/change password/i)).toBeInTheDocument();
  });

  it('initializes form fields from user context', () => {
    renderWithAuth(<Profile />);
    expect(screen.getByLabelText(/username/i)).toHaveValue('testuser');
    expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/bio/i)).toHaveValue('Test bio');
    expect(screen.getByLabelText(/location/i)).toHaveValue('Test City');
    expect(screen.getByLabelText(/website/i)).toHaveValue('https://test.com');
    expect(screen.getByLabelText(/github/i)).toHaveValue('https://github.com/testuser');
    expect(screen.getByLabelText(/linkedin/i)).toHaveValue('https://linkedin.com/in/testuser');
    expect(screen.getByLabelText(/twitter/i)).toHaveValue('https://twitter.com/testuser');
  });

  it('does not flicker or reset on re-render', () => {
    const { rerender } = renderWithAuth(<Profile />);
    expect(screen.getByLabelText(/username/i)).toHaveValue('testuser');
    rerender(
      <AuthContext.Provider value={{ user: mockUser, isLoggedIn: true, isLoading: false }}>
        <Profile />
      </AuthContext.Provider>
    );
    expect(screen.getByLabelText(/username/i)).toHaveValue('testuser');
  });
}); 