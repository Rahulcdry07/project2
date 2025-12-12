/**
 * Notes Controller - Handles user notes and documents
 */
const { Note } = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Get all notes for user
 */
exports.getNotes = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Note.findAndCountAll({
            where: { userId },
            order: [
                ['isPinned', 'DESC'],
                ['updatedAt', 'DESC']
            ],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        return sendSuccess(res, {
            notes: rows,
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
        }, 'Notes retrieved successfully');
    } catch (error) {
        logger.error('Error fetching notes', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Get single note
 */
exports.getNote = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const note = await Note.findOne({
            where: { id, userId }
        });

        if (!note) {
            return sendError(res, 'Note not found', 404);
        }

        return sendSuccess(res, note, 'Note retrieved successfully');
    } catch (error) {
        logger.error('Error fetching note', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Create new note
 */
exports.createNote = async (req, res) => {
    try {
        const userId = req.userId;
        const { title, content, color, tags } = req.body;

        if (!title) {
            return sendError(res, 'Title is required', 400);
        }

        const note = await Note.create({
            userId,
            title,
            content: content || '',
            color: color || 'default',
            tags: tags || []
        });

        return sendSuccess(res, note, 'Note created successfully', 201);
    } catch (error) {
        logger.error('Error creating note', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Update note
 */
exports.updateNote = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { title, content, color, isPinned, tags } = req.body;

        const note = await Note.findOne({
            where: { id, userId }
        });

        if (!note) {
            return sendError(res, 'Note not found', 404);
        }

        await note.update({
            ...(title !== undefined && { title }),
            ...(content !== undefined && { content }),
            ...(color !== undefined && { color }),
            ...(isPinned !== undefined && { isPinned }),
            ...(tags !== undefined && { tags })
        });

        return sendSuccess(res, note, 'Note updated successfully');
    } catch (error) {
        logger.error('Error updating note', { error: error.message });
        return sendError(res, error.message);
    }
};

/**
 * Delete note
 */
exports.deleteNote = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const note = await Note.findOne({
            where: { id, userId }
        });

        if (!note) {
            return sendError(res, 'Note not found', 404);
        }

        await note.destroy();

        return sendSuccess(res, null, 'Note deleted successfully');
    } catch (error) {
        logger.error('Error deleting note', { error: error.message });
        return sendError(res, error.message);
    }
};
