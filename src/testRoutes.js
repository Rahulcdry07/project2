/**
 * Test routes - Only available in test environment
 * These routes are only for testing purposes and should not be exposed in production
 */

const express = require('express');
const { User, sequelize } = require('./models');
const logger = require('./utils/logger');
const router = express.Router();

// Test route to verify a user
router.post('/verify-user', async (req, res) => {
  try {
    const { email } = req.body;
    await User.sync(); // Ensure table is ready
    const user = await User.findOne({ where: { email } });
    if (user) {
      user.is_verified = true;
      await user.save();
      res.status(200).json({ success: true, message: 'User verified successfully.' });
    } else {
      res.status(404).json({ success: false, error: 'User not found.' });
    }
  } catch (error) {
    logger.error('Verify user error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test route to set a user's role
router.post('/set-user-role', async (req, res) => {
  try {
    const { email, role } = req.body;
    await User.sync(); // Ensure table is ready
    const user = await User.findOne({ where: { email } });
    if (user) {
      user.role = role;
      await user.save();
      res.status(200).json({ success: true, message: `User role set to ${role} successfully.` });
    } else {
      res.status(404).json({ success: false, error: 'User not found.' });
    }
  } catch (error) {
    logger.error('Set user role error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
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
    // Ensure table exists before trying to clear it
    await User.sync();
    // For SQLite, we need to disable foreign keys before truncating
    await User.destroy({ where: {}, truncate: true });
    await sequelize.query('PRAGMA foreign_keys = ON');
    res.status(200).json({ success: true, message: 'Database cleared successfully.' });
  } catch (error) {
    logger.error('Clear database error:', { error: error.message, stack: error.stack });
    // Re-enable foreign keys even if there was an error
    try {
      await sequelize.query('PRAGMA foreign_keys = ON');
    } catch (e) {
      // Ignore errors when re-enabling
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test route to list all users (for debugging)
router.get('/list-users', async (req, res) => {
  try {
    await User.sync();
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'is_verified'],
    });
    res.status(200).json({ success: true, users });
  } catch (error) {
    logger.error('List users error:', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
