/**
 * Admin routes
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Get all users
router.get('/users', authenticate, isAdmin, adminController.getAllUsers);

// Update a user's role
router.put('/users/:id/role', authenticate, isAdmin, adminController.updateUserRole);

// Delete a user
router.delete('/users/:id', authenticate, isAdmin, adminController.deleteUser);

module.exports = router;