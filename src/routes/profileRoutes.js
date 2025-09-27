/**
 * Profile routes
 */
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const { uploadProfileImage, handleMulterError, validateUploadedFile } = require('../middleware/upload');

// Get user profile
router.get('/', authenticate, profileController.getProfile);

// Update user profile
router.put('/', authenticate, profileController.updateProfile);

// Upload profile picture endpoint
router.post('/profile-picture', 
    authenticate, 
    (req, res, next) => {
        uploadProfileImage(req, res, (err) => {
            if (err) {
                return handleMulterError(err, req, res, next);
            }
            next();
        });
    },
    validateUploadedFile,
    profileController.uploadProfilePicture
);

// Delete profile picture
router.delete('/picture', authenticate, profileController.deleteProfilePicture);

module.exports = router;
