import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ActivityLog from '../ActivityLog.jsx';
import * as api from '../../services/api';

vi.mock('../../services/api');

const mockActivities = [
  {
    id: 1,
    action: 'login',
    description: 'User logged in',
    ipAddress: '192.168.1.1',
    createdAt: '2025-12-07T12:00:00Z'
  },
  {
    id: 2,
    action: 'password_change',
    description: 'Password changed',
    ipAddress: '192.168.1.1',
    createdAt: '2025-12-07T11:00:00Z'
  },
  {
    id: 3,
    action: 'profile_update',
    description: 'Profile updated',
    ipAddress: '192.168.1.1',
    createdAt: '2025-12-07T10:00:00Z'
  }
];

const renderActivityLog = () => {
  return render(
    <BrowserRouter>
      <ActivityLog />
    </BrowserRouter>
  );
};

describe('ActivityLog Component', () => {
  beforeEach(() => {
    api.activityAPI = {
      getActivityLogs: vi.fn().mockResolvedValue({
        activities: mockActivities,
        total: 3,
        page: 1,
        totalPages: 1
      })
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders Activity Log page', async () => {
    renderActivityLog();
    
    await waitFor(() => {
      expect(screen.getByText('Activity Log')).toBeInTheDocument();
    });
  });

  test('displays activity list', async () => {
    renderActivityLog();
    
    await waitFor(() => {
      expect(screen.getByText('User logged in')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Password changed')).toBeInTheDocument();
    expect(screen.getByText('Profile updated')).toBeInTheDocument();
  });

  test('displays IP addresses', async () => {
    renderActivityLog();
    
    await waitFor(() => {
      const ipAddresses = screen.getAllByText(/192\.168\.1\.1/);
      expect(ipAddresses.length).toBeGreaterThan(0);
    });
  });

  test('shows loading state', () => {
    api.activityAPI.getActivityLogs = vi.fn().mockReturnValue(
      new Promise(() => {}) // Never resolves
    );
    
    renderActivityLog();
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays empty state when no activities', async () => {
    api.activityAPI.getActivityLogs = vi.fn().mockResolvedValue({
      activities: [],
      total: 0,
      page: 1,
      totalPages: 0
    });
    
    renderActivityLog();
    
    await waitFor(() => {
      expect(screen.getByText('No activity found')).toBeInTheDocument();
    });
  });

  test('shows activity icons based on action type', async () => {
    renderActivityLog();
    
    await waitFor(() => {
      const icons = document.querySelectorAll('.bi');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
