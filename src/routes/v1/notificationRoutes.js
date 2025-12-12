/**
 * Notification routes
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { 
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../../controllers/notificationController');

// Get user's notifications
router.get('/', authenticate, getNotifications);

// Mark notification as read
router.put('/:id/read', authenticate, markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticate, markAllAsRead);

// Delete notification
router.delete('/:id', authenticate, deleteNotification);

module.exports = router;
