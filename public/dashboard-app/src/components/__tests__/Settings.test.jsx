import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Settings from '../Settings.jsx';
import * as api from '../../services/api';
import * as auth from '../../utils/auth';

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../services/api');
vi.mock('../../utils/auth');

const mockCurrentUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  is_verified: true
};

const renderSettings = () => {
  return render(
    <BrowserRouter>
      <Settings />
    </BrowserRouter>
  );
};

describe('Settings Component', () => {
  beforeEach(() => {
    auth.getCurrentUser.mockReturnValue(mockCurrentUser);
    api.settingsAPI = {
      getSettings: vi.fn().mockResolvedValue({
        theme: 'light',
        language: 'en',
        emailNotifications: true,
        securityAlerts: true,
        marketingEmails: false
      }),
      updateSettings: vi.fn().mockResolvedValue({ success: true }),
      changePassword: vi.fn().mockResolvedValue({ success: true })
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders Settings page with tabs', async () => {
    renderSettings();
    
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  test('displays profile information in Profile tab', async () => {
    renderSettings();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    });
    
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('user')).toBeInTheDocument();
  });

  test('switches to General tab and displays settings', async () => {
    renderSettings();
    
    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
    });
    
    const generalTab = screen.getByText('General');
    fireEvent.click(generalTab);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Theme')).toBeInTheDocument();
      expect(screen.getByLabelText('Language')).toBeInTheDocument();
    });
  });

  test('changes password successfully', async () => {
    renderSettings();
    
    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument();
    });
    
    const securityTab = screen.getByText('Security');
    fireEvent.click(securityTab);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'oldPassword123' }
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'newPassword123' }
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'newPassword123' }
    });
    
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(changePasswordButton);
    
    await waitFor(() => {
      expect(api.settingsAPI.changePassword).toHaveBeenCalledWith(
        'oldPassword123',
        'newPassword123'
      );
    });
  });

  test('validates password mismatch', async () => {
    renderSettings();
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByText('Security')).toBeInTheDocument();
    });
    
    const securityTab = screen.getByText('Security');
    fireEvent.click(securityTab);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'oldPassword123' }
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'newPassword123' }
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'differentPassword' }
    });
    
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(changePasswordButton);
    
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    
    // API should not be called when validation fails
    expect(api.settingsAPI.changePassword).not.toHaveBeenCalled();
  });

  test('updates general settings', async () => {
    renderSettings();
    
    // Wait for settings to load
    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
    
    const generalTab = screen.getByText('General');
    fireEvent.click(generalTab);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText('Theme'), {
      target: { value: 'dark' }
    });
    
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(api.settingsAPI.updateSettings).toHaveBeenCalled();
    });
  });
});
