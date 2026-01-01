/**
 * DSR (Detailed Schedule of Rates) Routes
 * Handles cost estimation and DSR matching
 */

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth');
const { sendSuccess, sendError } = require('../../utils/apiResponse');
const logger = require('../../utils/logger');
const { DSRItem } = require('../../models');
const DSRMatchingService = require('../../services/dsrMatchingService');

const dsrService = new DSRMatchingService(DSRItem);

/**
 * @swagger
 * /api/dsr/estimate:
 *   post:
 *     summary: Calculate cost estimate from PDF JSON data
 *     tags: [DSR]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pdfData:
 *                 type: object
 *                 description: Converted PDF JSON data
 *     responses:
 *       200:
 *         description: Cost estimate calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     extracted_items:
 *                       type: integer
 *                     matches:
 *                       type: array
 *                     cost_estimate:
 *                       type: object
 *                     report_link:
 *                       type: string
 *                       description: URL to view detailed report
 *                     report_id:
 *                       type: string
 *                       description: Unique report identifier
 *       401:
 *         description: Unauthorized
 */
router.post('/estimate', authenticate, async (req, res) => {
  try {
    const { pdfData } = req.body;

    if (!pdfData) {
      return sendError(res, 'PDF data is required', 400);
    }

    logger.info('Calculating cost estimate from PDF data');

    // Extract line items from PDF
    const extractedItems = dsrService.extractLineItems(pdfData);

    if (extractedItems.length === 0) {
      return sendSuccess(
        res,
        {
          extracted_items: 0,
          matches: [],
          cost_estimate: {
            total_cost: 0,
            matched_items: 0,
            unmatched_items: 0,
            total_items: 0,
            match_percentage: 0,
            breakdown: [],
          },
        },
        'No items found in PDF'
      );
    }

    // Match with DSR database
    const matches = await dsrService.matchWithDSR(extractedItems);

    // Calculate cost
    const costEstimate = dsrService.calculateCost(matches);

    // Generate unique report ID and store report data
    const reportId = `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize global reports storage if not exists
    if (!global.dsrReports) {
      global.dsrReports = {};
    }

    // Store report data (in production, use database with TTL)
    global.dsrReports[reportId] = {
      report_id: reportId,
      generated_at: new Date().toISOString(),
      extracted_items: extractedItems.length,
      matches,
      cost_estimate: costEstimate,
      user_id: req.userId || null,
    };

    // Clean up old reports (keep only last 100)
    const reportKeys = Object.keys(global.dsrReports);
    if (reportKeys.length > 100) {
      const oldestKeys = reportKeys.sort().slice(0, reportKeys.length - 100);
      oldestKeys.forEach(key => delete global.dsrReports[key]);
    }

    logger.info('Cost estimate calculated', {
      totalItems: extractedItems.length,
      matchedItems: costEstimate.matched_items,
      totalCost: costEstimate.total_cost,
      reportId,
    });

    return sendSuccess(
      res,
      {
        extracted_items: extractedItems.length,
        matches,
        cost_estimate: costEstimate,
        report_link: `/api/v1/dsr/report/${reportId}`,
        report_id: reportId,
      },
      'Cost estimate calculated successfully'
    );
  } catch (error) {
    logger.error('Cost estimation error:', { error: error.message, stack: error.stack });
    return sendError(res, error.message || 'Cost estimation failed', 500);
  }
});

/**
 * @swagger
 * /api/dsr/items:
 *   get:
 *     summary: Get all DSR items
 *     tags: [DSR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: DSR items retrieved successfully
 */
router.get('/items', authenticate, async (req, res) => {
  try {
    const { category, search, limit = 50 } = req.query;

    const where = { is_active: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { item_code: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const items = await DSRItem.findAll({
      where,
      limit: parseInt(limit),
      order: [['item_code', 'ASC']],
    });

    return sendSuccess(res, { items, count: items.length }, 'DSR items retrieved successfully');
  } catch (error) {
    logger.error('Error fetching DSR items:', { error: error.message });
    return sendError(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/dsr/items:
 *   post:
 *     summary: Create new DSR item (Admin only)
 *     tags: [DSR]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - item_code
 *               - description
 *               - unit
 *               - rate
 *             properties:
 *               item_code:
 *                 type: string
 *               description:
 *                 type: string
 *               unit:
 *                 type: string
 *               rate:
 *                 type: number
 *               category:
 *                 type: string
 *               sub_category:
 *                 type: string
 *     responses:
 *       201:
 *         description: DSR item created successfully
 */
router.post('/items', authenticate, isAdmin, async (req, res) => {
  try {
    const allowedFields = ['item_code', 'description', 'unit', 'rate', 'category', 'sub_category'];

    const itemData = allowedFields.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {});

    const item = await DSRItem.create(itemData);

    logger.info('DSR item created', { item_code: item.item_code, userId: req.userId });

    return sendSuccess(res, { item }, 'DSR item created successfully', 201);
  } catch (error) {
    logger.error('Error creating DSR item:', { error: error.message });
    return sendError(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/dsr/items/{id}:
 *   put:
 *     summary: Update DSR item (Admin only)
 *     tags: [DSR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: DSR item updated successfully
 */
router.put('/items/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      'item_code',
      'description',
      'unit',
      'rate',
      'category',
      'sub_category',
      'is_active',
    ];

    const updateData = allowedFields.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {});

    const item = await DSRItem.findByPk(id);

    if (!item) {
      return sendError(res, 'DSR item not found', 404);
    }

    await item.update(updateData);

    logger.info('DSR item updated', { id, userId: req.userId });

    return sendSuccess(res, { item }, 'DSR item updated successfully');
  } catch (error) {
    logger.error('Error updating DSR item:', { error: error.message });
    return sendError(res, error.message, 400);
  }
});

/**
 * @swagger
 * /api/dsr/categories:
 *   get:
 *     summary: Get all DSR categories
 *     tags: [DSR]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories', authenticate, async (req, res) => {
  try {
    const { QueryTypes } = require('sequelize');
    const { sequelize } = require('../../models');

    const categories = await sequelize.query(
      'SELECT DISTINCT category FROM "DSRItems" WHERE is_active = true AND category IS NOT NULL ORDER BY category',
      { type: QueryTypes.SELECT }
    );

    return sendSuccess(
      res,
      {
        categories: categories.map(c => c.category),
      },
      'Categories retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching categories:', { error: error.message });
    return sendError(res, error.message, 500);
  }
});

/**
 * @swagger
 * /api/dsr/report/{id}:
 *   get:
 *     summary: Get detailed cost estimation report
 *     tags: [DSR]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Detailed report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Report not found
 */
router.get('/report/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // For now, we'll store reports in memory (in production, use database)
    // This is a simplified implementation - in production you'd store reports persistently
    const report = global.dsrReports?.[id];

    if (!report) {
      return sendError(res, 'Report not found', 404);
    }

    if (report.user_id && report.user_id !== req.userId) {
      return sendError(res, 'You are not authorized to access this report', 403);
    }

    // Generate detailed report with additional information
    const detailedReport = {
      report_id: id,
      generated_at: report.generated_at,
      extracted_items: report.extracted_items,
      matches: report.matches,
      cost_estimate: report.cost_estimate,
      summary: {
        total_items: report.extracted_items,
        matched_percentage: report.cost_estimate.match_percentage,
        total_cost: report.cost_estimate.total_cost,
        matched_items: report.cost_estimate.matched_items,
        unmatched_items: report.cost_estimate.unmatched_items,
      },
      detailed_breakdown: report.cost_estimate.breakdown.map(item => ({
        ...item,
        // Add more details if needed
        category:
          report.matches.find(m => m.extracted.description === item.description)?.dsr_item
            ?.category || 'Unknown',
      })),
    };

    return sendSuccess(res, detailedReport, 'Detailed report retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving detailed report:', { error: error.message });
    return sendError(res, error.message, 500);
  }
});

module.exports = router;
