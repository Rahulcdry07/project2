/**
 * Notification Controller - Handles user notifications
 */
const { Notification } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Get user's notifications
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;
        const offset = (page - 1) * limit;

        const where = { userId };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const { count, rows } = await Notification.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const unreadCount = await Notification.count({
            where: { userId, isRead: false }
        });

        return sendSuccess(res, {
            notifications: rows,
            total: count,
            unreadCount,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
        }, 'Notifications retrieved successfully');
    } catch (error) {
        logger.error('Error fetching notifications', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { id, userId }
        });

        if (!notification) {
            return sendError(res, 'Notification not found', 404);
        }

        await notification.update({
            isRead: true,
            readAt: new Date()
        });

        return sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
        logger.error('Error marking notification as read', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.userId;

        await Notification.update(
            { isRead: true, readAt: new Date() },
            { where: { userId, isRead: false } }
        );

        return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) {
        logger.error('Error marking all notifications as read', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: { id, userId }
        });

        if (!notification) {
            return sendError(res, 'Notification not found', 404);
        }

        await notification.destroy();

        return sendSuccess(res, null, 'Notification deleted successfully');
    } catch (error) {
        logger.error('Error deleting notification', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Create notification (internal function)
 */
exports.createNotification = async (userId, type, title, message, link = null) => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            link
        });

        logger.info('Notification created', { userId, type, title });
        return notification;
    } catch (error) {
        logger.error('Error creating notification', { error: error.message });
        throw error;
    }
};
