import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Notifications from '../Notifications.jsx';
import * as api from '../../services/api';

import { describe, expect, beforeEach, vi } from 'vitest';

vi.mock('../../services/api');

const mockNotifications = [
  {
    id: 1,
    type: 'info',
    title: 'Welcome',
    message: 'Welcome to the platform',
    isRead: false,
    createdAt: '2025-12-07T12:00:00Z'
  },
  {
    id: 2,
    type: 'success',
    title: 'Profile Updated',
    message: 'Your profile has been updated',
    isRead: true,
    createdAt: '2025-12-07T11:00:00Z'
  },
  {
    id: 3,
    type: 'warning',
    title: 'Security Alert',
    message: 'New login detected',
    isRead: false,
    createdAt: '2025-12-07T10:00:00Z'
  }
];

const renderNotifications = () => {
  return render(
    <BrowserRouter>
      <Notifications />
    </BrowserRouter>
  );
};

describe('Notifications Component', () => {
  beforeEach(() => {
    vi.spyOn(api, 'notificationAPI', 'get').mockReturnValue({
      getNotifications: vi.fn().mockResolvedValue({
        notifications: mockNotifications,
        unreadCount: 2
      }),
      markAsRead: vi.fn().mockResolvedValue({ success: true }),
      markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
      deleteNotification: vi.fn().mockResolvedValue({ success: true })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders Notifications page', async () => {
    renderNotifications();
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  test('displays notification list', async () => {
    renderNotifications();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Profile Updated')).toBeInTheDocument();
    expect(screen.getByText('Security Alert')).toBeInTheDocument();
  });

  test('displays unread count badge', async () => {
    renderNotifications();
    
    await waitFor(() => {
      expect(screen.getByText('2 unread')).toBeInTheDocument();
    });
  });

  test('marks notification as read', async () => {
    renderNotifications();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
    
    const markAsReadButtons = screen.getAllByText('Mark as Read');
    fireEvent.click(markAsReadButtons[0]);
    
    await waitFor(() => {
      expect(api.notificationAPI.markAsRead).toHaveBeenCalledWith(1);
    });
  });

  test('marks all notifications as read', async () => {
    renderNotifications();
    
    await waitFor(() => {
      expect(screen.getByText('Mark All as Read')).toBeInTheDocument();
    });
    
    const markAllButton = screen.getByText('Mark All as Read');
    fireEvent.click(markAllButton);
    
    await waitFor(() => {
      expect(api.notificationAPI.markAllAsRead).toHaveBeenCalled();
    });
  });

  test('deletes notification', async () => {
    renderNotifications();
    
    await waitFor(() => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(api.notificationAPI.deleteNotification).toHaveBeenCalledWith(1);
    });
  });

  test('displays empty state when no notifications', async () => {
    api.notificationAPI.getNotifications = vi.fn().mockResolvedValue({
      notifications: [],
      unreadCount: 0
    });
    
    renderNotifications();
    
    await waitFor(() => {
      expect(screen.getByText('No notifications')).toBeInTheDocument();
    });
  });

  test('shows different icons for notification types', async () => {
    const { container } = renderNotifications();
    
    await waitFor(() => {
      /* eslint-disable testing-library/no-container, testing-library/no-node-access */
      const icons = container.querySelectorAll('.bi-info-circle, .bi-check-circle, .bi-exclamation-triangle');
      /* eslint-enable testing-library/no-container, testing-library/no-node-access */
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
