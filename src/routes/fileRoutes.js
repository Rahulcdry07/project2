/**
 * File routes for document upload and management
 */
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authenticate } = require('../middleware/auth');
const { uploadDocument, handleMulterError, validateUploadedFile } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiting');

// Multi-file upload (new endpoint)
router.post('/upload', authenticate, uploadLimiter, uploadDocument.array('files', 10), handleMulterError, validateUploadedFile, fileController.uploadFiles);

// Single document upload (legacy endpoint)
router.post('/upload-document', authenticate, uploadLimiter, uploadDocument.single('document'), handleMulterError, validateUploadedFile, fileController.uploadDocument);

// Get user's files (with filtering, pagination, search)
router.get('/', authenticate, fileController.getUserFiles);

// Get user's documents (legacy endpoint)
router.get('/documents', authenticate, fileController.getDocuments);

// Get file analytics
router.get('/analytics', authenticate, fileController.getFileAnalytics);

// Search documents
router.get('/search', authenticate, fileController.searchDocuments);

// Download file
router.get('/:fileId/download', authenticate, fileController.downloadFile);

// Get specific document (legacy)
router.get('/:id', authenticate, fileController.getDocument);

// Download document (legacy)
router.get('/:id/download-document', authenticate, fileController.downloadDocument);

// Bulk delete files
router.post('/bulk-delete', authenticate, fileController.bulkDeleteFiles);

// Delete file
router.delete('/:fileId', authenticate, fileController.deleteFile);

// Delete document (legacy)
router.delete('/:id/document', authenticate, fileController.deleteDocument);

module.exports = router;