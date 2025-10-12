/**
 * Tender Routes
 */
const express = require('express');
const router = express.Router();
const tenderController = require('../controllers/tenderController');
const { authenticate, isAdmin } = require('../middleware/auth');

// List tenders (public)
router.get('/', tenderController.list);

// Get tender details (public)
router.get('/:id', tenderController.get);

// Create tender (admin only)
router.post('/', authenticate, isAdmin, tenderController.create);

// Update tender (admin only)
router.put('/:id', authenticate, isAdmin, tenderController.update);

// Delete tender (admin only)
router.delete('/:id', authenticate, isAdmin, tenderController.remove);

module.exports = router;
