/**
 * Test routes - Only available in test environment
 * These routes are only for testing purposes and should not be exposed in production
 */

const express = require('express');
const { User } = require('./models');
const router = express.Router();

// Test route to verify a user
router.post('/verify-user', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (user) {
            user.is_verified = true;
            await user.save();
            res.status(200).json({ message: 'User verified successfully.' });
        } else {
            res.status(404).json({ error: 'User not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test route to set a user's role
router.post('/set-user-role', async (req, res) => {
    try {
        const { email, role } = req.body;
        const user = await User.findOne({ where: { email } });
        if (user) {
            user.role = role;
            await user.save();
            res.status(200).json({ message: `User role set to ${role} successfully.` });
        } else {
            res.status(404).json({ error: 'User not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test route to get a reset token
router.post('/get-reset-token', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (user && user.reset_token) {
            res.status(200).json({ resetToken: user.reset_token });
        } else {
            res.status(404).json({ error: 'User or reset token not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test route to clear the database
router.post('/clear-database', async (req, res) => {
    try {
        await User.destroy({ where: {}, truncate: true });
        res.status(200).json({ message: 'Database cleared successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;