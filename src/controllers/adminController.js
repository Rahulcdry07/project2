/**
 * Admin controller
 */
const { User } = require('../models');

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllUsers = async (req, res) => {
    console.log('[AdminController] getAllUsers called');
    console.log('[AdminController] Request user:', { id: req.userId, role: req.userRole });
    
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
        
        console.log(`[AdminController] Found ${mappedUsers.length} users`);
        console.log('[AdminController] User data sample:', 
            mappedUsers.length > 0 ? JSON.stringify(mappedUsers[0]) : 'No users found');
        
        res.json(mappedUsers);
    } catch (error) {
        console.error('[AdminController] Error in getAllUsers:', error);
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
    
    console.log(`[AdminController] updateUserRole called for user ID: ${userId}`);
    console.log(`[AdminController] New role: ${role}`);
    console.log('[AdminController] Request user:', { id: req.userId, role: req.userRole });
    
    try {
        const user = await User.findByPk(userId);
        
        if (!user) {
            console.log(`[AdminController] User with ID ${userId} not found`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`[AdminController] Found user: ${user.username}, current role: ${user.role}`);
        
        await user.update({ role });
        
        console.log(`[AdminController] Role updated successfully to: ${role}`);
        
        const { id, username, email, role: userRole, is_verified } = user;
        res.json({ 
            id, 
            username, 
            email, 
            role: userRole, 
            emailVerified: is_verified === true
        });
    } catch (error) {
        console.error('[AdminController] Error in updateUserRole:', error);
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
    
    console.log(`[AdminController] deleteUser called for user ID: ${userId}`);
    console.log('[AdminController] Request user:', { id: req.userId, role: req.userRole });
    
    try {
        const user = await User.findByPk(userId);
        
        if (!user) {
            console.log(`[AdminController] User with ID ${userId} not found`);
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`[AdminController] Found user: ${user.username}, role: ${user.role}`);
        
        await user.destroy();
        console.log(`[AdminController] User ${user.username} deleted successfully`);
        
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('[AdminController] Error in deleteUser:', error);
        res.status(500).json({ error: error.message });
    }
};