/**
 * User profile controller
 */
const { User } = require('../models');

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (user) {
            // Remove sensitive fields
            const { id, username, email, role, is_verified } = user;
            res.json({ id, username, email, role, is_verified });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (user) {
            const { username, email } = req.body;
            await user.update({ username, email });
            const { id, username: uname, email: uemail, role, is_verified } = user;
            res.json({ id, username: uname, email: uemail, role, is_verified });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};