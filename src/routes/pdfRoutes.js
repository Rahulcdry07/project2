/**
 * PDF Conversion Routes
 * Handles PDF to JSON conversion requests
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfConverter = require('../services/pdfConverter');
const { authenticate } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/pdfs');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

/**
 * @swagger
 * /api/pdf/convert:
 *   post:
 *     summary: Convert PDF to JSON
 *     tags: [PDF Conversion]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               includeMetadata:
 *                 type: boolean
 *                 default: false
 *               extractTables:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: PDF converted successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/convert', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'No PDF file uploaded', 400);
    }

    const includeMetadata = req.body.includeMetadata === 'true';
    const extractTables = req.body.extractTables === 'true';

    logger.info(`Converting PDF: ${req.file.originalname}`);

    const result = await pdfConverter.convertPDFToJSON(req.file.path, {
      includeMetadata,
      extractTables,
    });

    // Save JSON result
    const jsonFilename = path.basename(req.file.path, '.pdf') + '.json';
    const jsonPath = path.join(path.dirname(req.file.path), jsonFilename);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.writeFile(jsonPath, JSON.stringify(result, null, 2));

    return sendSuccess(
      res,
      {
        originalFilename: req.file.originalname,
        pdfPath: req.file.path,
        jsonPath: jsonPath,
        jsonFilename: jsonFilename,
        totalPages: result.total_pages,
        hasMetadata: includeMetadata,
        hasTables: extractTables,
        data: result,
      },
      'PDF converted successfully'
    );
  } catch (error) {
    logger.error('PDF conversion error:', error);

    // Clean up uploaded file on error
    if (req.file) {
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Failed to delete uploaded file:', unlinkError);
      }
    }

    return sendError(res, error.message || 'PDF conversion failed', 500);
  }
});

/**
 * @swagger
 * /api/pdf/download/{filename}:
 *   get:
 *     summary: Download converted JSON file
 *     tags: [PDF Conversion]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: JSON file downloaded
 *       404:
 *         description: File not found
 */
router.get('/download/:filename', authenticate, async (req, res) => {
  try {
    const uploadsDir = path.resolve(__dirname, '../../uploads/pdfs');
    const requestedName = path.basename(req.params.filename);
    const filePath = path.resolve(uploadsDir, requestedName);

    // Ensure the resolved path is within the uploads directory to prevent traversal
    if (!filePath.startsWith(uploadsDir)) {
      logger.warn('Blocked path traversal attempt for download', { filename: req.params.filename });
      return sendError(res, 'Invalid file path', 400);
    }

    // Check if file exists
    await fs.access(filePath);

    res.download(filePath, requestedName);
  } catch (error) {
    logger.error('Download error:', error);
    return sendError(res, 'File not found', 404);
  }
});

module.exports = router;
