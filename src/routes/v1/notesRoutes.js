/**
 * Notes routes
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const {
    getNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote
} = require('../../controllers/notesController');

// Get all notes
router.get('/', authenticate, getNotes);

// Get single note
router.get('/:id', authenticate, getNote);

// Create note
router.post('/', authenticate, createNote);

// Update note
router.put('/:id', authenticate, updateNote);

// Delete note
router.delete('/:id', authenticate, deleteNote);

module.exports = router;
