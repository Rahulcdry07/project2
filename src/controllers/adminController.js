/**
 * Admin controller
 */
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllUsers = async (req, res) => {
    logger.info('[AdminController] getAllUsers called');
    logger.debug('[AdminController] Request user:', { id: req.userId, role: req.userRole });
    
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password', 'verification_token', 'reset_token', 'reset_token_expires_at'] }
        });
        
        // Map the database fields to match the frontend expectations
        const mappedUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            emailVerified: user.is_verified === true, // Convert to boolean
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
        
        logger.info(`[AdminController] Found ${mappedUsers.length} users`);
        logger.debug('[AdminController] User data sample:', 
            mappedUsers.length > 0 ? JSON.stringify(mappedUsers[0]) : 'No users found');
        
        res.json(mappedUsers);
    } catch (error) {
        logger.error('[AdminController] Error in getAllUsers:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update a user's role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateUserRole = async (req, res) => {
    const userId = req.params.id;
    const { role } = req.body;
    
    logger.info(`[AdminController] updateUserRole called for user ID: ${userId}`);
    logger.debug(`[AdminController] New role: ${role}`);
    logger.debug('[AdminController] Request user:', { id: req.userId, role: req.userRole });
    
    try {
        const user = await User.findByPk(userId);
        
        if (!user) {
            logger.warn(`[AdminController] User with ID ${userId} not found`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        logger.debug(`[AdminController] Found user: ${user.username}, current role: ${user.role}`);
        
        await user.update({ role });
        
        logger.info(`[AdminController] Role updated successfully to: ${role}`);
        
        const { id, username, email, role: userRole, is_verified } = user;
        res.json({ 
            id, 
            username, 
            email, 
            role: userRole, 
            emailVerified: is_verified === true
        });
    } catch (error) {
        logger.error('[AdminController] Error in updateUserRole:', error);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Delete a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;
    
    logger.info(`[AdminController] deleteUser called for user ID: ${userId}`);
    logger.debug('[AdminController] Request user:', { id: req.userId, role: req.userRole });
    
    try {
        const user = await User.findByPk(userId);
        
        if (!user) {
            logger.warn(`[AdminController] User with ID ${userId} not found`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        logger.debug(`[AdminController] Found user: ${user.username}, role: ${user.role}`);
        
        await user.destroy();
        logger.info(`[AdminController] User ${user.username} deleted successfully`);
        
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        logger.error('[AdminController] Error in deleteUser:', error);
        res.status(500).json({ error: error.message });
    }
};