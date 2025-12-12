/**
 * Settings Controller - Handles user settings and preferences
 */
const { UserSettings, User } = require('../models');
const bcrypt = require('bcrypt');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { logActivity } = require('./activityController');
const { createNotification } = require('./notificationController');

/**
 * Get user settings
 */
exports.getSettings = async (req, res) => {
    try {
        const userId = req.userId;

        let settings = await UserSettings.findOne({
            where: { userId }
        });

        // Create default settings if they don't exist
        if (!settings) {
            settings = await UserSettings.create({ userId });
        }

        return sendSuccess(res, settings, 'Settings retrieved successfully');
    } catch (error) {
        logger.error('Error fetching settings', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Update user settings
 */
exports.updateSettings = async (req, res) => {
    try {
        const userId = req.userId;
        const { theme, language, timezone, emailNotifications, securityAlerts, marketingEmails, preferences } = req.body;

        let settings = await UserSettings.findOne({
            where: { userId }
        });

        if (!settings) {
            settings = await UserSettings.create({ userId });
        }

        await settings.update({
            ...(theme !== undefined && { theme }),
            ...(language !== undefined && { language }),
            ...(timezone !== undefined && { timezone }),
            ...(emailNotifications !== undefined && { emailNotifications }),
            ...(securityAlerts !== undefined && { securityAlerts }),
            ...(marketingEmails !== undefined && { marketingEmails }),
            ...(preferences !== undefined && { preferences })
        });

        await logActivity(userId, 'settings_update', 'User updated settings', req);

        return sendSuccess(res, settings, 'Settings updated successfully');
    } catch (error) {
        logger.error('Error updating settings', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendError(res, 'Current and new passwords are required', 400);
        }

        if (newPassword.length < 6) {
            return sendError(res, 'New password must be at least 6 characters long', 400);
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return sendError(res, 'Current password is incorrect', 401);
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        // Log activity
        await logActivity(userId, 'password_change', 'Password changed successfully', req);

        // Create notification
        await createNotification(
            userId,
            'security',
            'Password Changed',
            'Your password was changed successfully. If you did not make this change, please contact support immediately.'
        );

        return sendSuccess(res, null, 'Password changed successfully');
    } catch (error) {
        logger.error('Error changing password', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Update email
 */
exports.updateEmail = async (req, res) => {
    try {
        const userId = req.userId;
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 'Email and password are required', 400);
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return sendError(res, 'Password is incorrect', 401);
        }

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser && existingUser.id !== userId) {
            return sendError(res, 'Email already in use', 400);
        }

        // Update email
        await user.update({ email, is_verified: false });

        // Log activity
        await logActivity(userId, 'email_change', `Email changed to ${email}`, req);

        // Create notification
        await createNotification(
            userId,
            'info',
            'Email Updated',
            'Your email address was updated. Please verify your new email address.'
        );

        return sendSuccess(res, { email: user.email }, 'Email updated successfully. Please verify your new email.');
    } catch (error) {
        logger.error('Error updating email', { error: error.message });
        return sendError(res, error.message);
    }
};
