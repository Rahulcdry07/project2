/**
 * Admin controller
 */
const { User, ActivityLog, Notification, Note, UserSettings } = require('../models');
const logger = require('../utils/logger');

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllUsers = async (req, res) => {
    logger.info('getAllUsers called', { userId: req.userId, userRole: req.userRole });
    
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Sorting parameters
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
        
        // Query with pagination
        const { count, rows: users } = await User.findAndCountAll({
            attributes: { exclude: ['password', 'verification_token', 'reset_token', 'reset_token_expires_at'] },
            limit,
            offset,
            order: [[sortBy, sortOrder]]
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
        
        // Calculate pagination metadata
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        logger.info(`Found ${count} users, returning page ${page}`, { 
            total: count,
            page,
            limit,
            totalPages
        });
        
        res.json({
            data: mappedUsers,
            pagination: {
                total: count,
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        logger.error('Error in getAllUsers', { error: error.message, stack: error.stack });
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
    
    logger.info('updateUserRole called', { 
        targetUserId: userId, 
        newRole: role, 
        requestUserId: req.userId, 
        requestUserRole: req.userRole 
    });
    
    try {
        const user = await User.findByPk(userId);
        
        if (!user) {
            logger.warn('updateUserRole: User not found', { userId });
            return res.status(404).json({ error: 'User not found' });
        }
        
        logger.info('Found user for role update', { username: user.username, currentRole: user.role });
        
        await user.update({ role });
        
        logger.info('Role updated successfully', { userId, username: user.username, newRole: role });
        
        const { id, username, email, role: userRole, is_verified } = user;
        res.json({ 
            id, 
            username, 
            email, 
            role: userRole, 
            emailVerified: is_verified === true
        });
    } catch (error) {
        logger.error('Error in updateUserRole', { error: error.message, stack: error.stack, userId });
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
    
    logger.info('deleteUser called', { userId, requestUserId: req.userId, requestUserRole: req.userRole });
    
    try {
        const user = await User.findByPk(userId);
        
        if (!user) {
            logger.warn('deleteUser: User not found', { userId });
            return res.status(404).json({ error: 'User not found' });
        }
        
        logger.info('Found user for deletion', { username: user.username, role: user.role });
        
        // Manually delete related records to avoid FK constraint issues
        await ActivityLog.destroy({ where: { userId } });
        await Notification.destroy({ where: { userId } });
        await Note.destroy({ where: { userId } });
        await UserSettings.destroy({ where: { userId } });
        
        // Now delete the user
        await user.destroy({ force: true });
        logger.info('User deleted successfully', { userId, username: user.username });
        
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        logger.error('Error in deleteUser', { error: error.message, stack: error.stack, userId });
        res.status(500).json({ error: error.message });
    }
};