/**
 * File routes for document upload and management
 */
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticate } = require('../middleware/auth');
const { uploadDocument, handleMulterError, validateUploadedFile } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiting');

// Upload document
router.post('/upload', authenticate, uploadLimiter, uploadDocument.single('document'), handleMulterError, validateUploadedFile, fileController.uploadDocument);

// Get user's documents
router.get('/', authenticate, fileController.getDocuments);

// Search documents
router.get('/search', authenticate, fileController.searchDocuments);

// Get specific document
router.get('/:id', authenticate, fileController.getDocument);

// Download document
router.get('/:id/download', authenticate, fileController.downloadDocument);

// Delete document
router.delete('/:id', authenticate, fileController.deleteDocument);

module.exports = router;