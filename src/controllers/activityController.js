/**
 * Activity Log Controller - Handles activity tracking
 */
const { ActivityLog } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Get user's activity logs
 */
exports.getUserActivityLogs = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20, action } = req.query;
        const offset = (page - 1) * limit;

        const where = { userId };
        if (action) {
            where.action = action;
        }

        const { count, rows } = await ActivityLog.findAndCountAll({
            where,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        return sendSuccess(res, {
            activities: rows,
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
        }, 'Activity logs retrieved successfully');
    } catch (error) {
        logger.error('Error fetching activity logs', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Log an activity
 */
exports.logActivity = async (userId, action, description, req = null) => {
    try {
        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.connection.remoteAddress) : null;
        const userAgent = req ? req.headers['user-agent'] : null;

        await ActivityLog.create({
            userId,
            action,
            description,
            ipAddress,
            userAgent
        });

        logger.info('Activity logged', { userId, action });
    } catch (error) {
        logger.error('Error logging activity', { error: error.message, userId, action });
    }
};
