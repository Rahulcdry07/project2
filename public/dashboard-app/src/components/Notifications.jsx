import React, { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './common/Toast';

const Notifications = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationAPI.getNotifications(1, 50);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      showError('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess('All notifications marked as read');
    } catch (error) {
      showError('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showSuccess('Notification deleted');
    } catch (error) {
      showError('Failed to delete notification');
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      info: 'bi-info-circle text-info',
      success: 'bi-check-circle text-success',
      warning: 'bi-exclamation-triangle text-warning',
      error: 'bi-x-circle text-danger',
      security: 'bi-shield-check text-primary'
    };
    return icons[type] || 'bi-bell text-secondary';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <h1>Notifications</h1>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-right" />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="badge bg-primary">{unreadCount} unread</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-outline-primary" onClick={handleMarkAllAsRead}>
              <i className="bi bi-check-all me-2"></i>
              Mark All as Read
            </button>
          )}
        </div>

        <div className="card">
          <div className="card-body p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-bell-slash" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                <p className="text-muted mt-3">No notifications</p>
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`list-group-item ${!notification.isRead ? 'bg-light' : ''}`}
                  >
                    <div className="d-flex align-items-start">
                      <div className="me-3 mt-1">
                        <i className={`bi ${getTypeIcon(notification.type)} fs-4`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between">
                          <h6 className="mb-1">{notification.title}</h6>
                          <small className="text-muted">{formatDate(notification.createdAt)}</small>
                        </div>
                        <p className="mb-2 text-muted">{notification.message}</p>
                        <div className="d-flex gap-2">
                          {!notification.isRead && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Mark as Read
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(notification.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Notifications;
