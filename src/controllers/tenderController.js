/**
 * Tender Controller
 * Handles CRUD operations and search for tenders
 */
const { Tender, TenderApplication, TenderDocument, User } = require('../models');
const { Op } = require('sequelize');

module.exports = {
    // List all tenders with optional filters
    async list(req, res) {
        try {
            const { category, location, status, q } = req.query;
            const where = {};
            if (category) where.category = category;
            if (location) where.location = location;
            if (status) where.status = status;
            if (q) {
                where[Op.or] = [
                    { title: { [Op.like]: `%${q}%` } },
                    { description: { [Op.like]: `%${q}%` } },
                    { organization: { [Op.like]: `%${q}%` } }
                ];
            }
            const tenders = await Tender.findAll({
                where,
                order: [['published_date', 'DESC']],
                include: [
                    { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
                    { model: TenderDocument, as: 'documents' }
                ]
            });
            res.json({ success: true, tenders });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Get details of a single tender
    async get(req, res) {
        try {
            const { id } = req.params;
            const tender = await Tender.findByPk(id, {
                include: [
                    { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
                    { model: TenderDocument, as: 'documents' },
                    { model: TenderApplication, as: 'applications' }
                ]
            });
            if (!tender) return res.status(404).json({ success: false, error: 'Tender not found' });
            res.json({ success: true, tender });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    },

    // Create a new tender (admin only)
    async create(req, res) {
        try {
            const {
                title, description, reference_number, organization, category, location,
                estimated_value, currency, submission_deadline, published_date, status,
                contact_person, contact_email, contact_phone, requirements,
                documents_required, eligibility_criteria, evaluation_criteria, tags, is_featured
            } = req.body;
            const tender = await Tender.create({
                title, description, reference_number, organization, category, location,
                estimated_value, currency, submission_deadline, published_date, status,
                contact_person, contact_email, contact_phone, requirements,
                documents_required, eligibility_criteria, evaluation_criteria, tags, is_featured,
                created_by: req.userId
            });
            res.status(201).json({ success: true, tender });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    },

    // Update a tender (admin only)
    async update(req, res) {
        try {
            const { id } = req.params;
            const tender = await Tender.findByPk(id);
            if (!tender) return res.status(404).json({ success: false, error: 'Tender not found' });
            await tender.update(req.body);
            res.json({ success: true, tender });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    },

    // Delete a tender (admin only)
    async remove(req, res) {
        try {
            const { id } = req.params;
            const tender = await Tender.findByPk(id);
            if (!tender) return res.status(404).json({ success: false, error: 'Tender not found' });
            await tender.destroy();
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
};
