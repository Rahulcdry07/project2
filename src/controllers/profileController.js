/**
 * User profile controller
 */
const { User } = require('../models');
const { deleteUploadedFile } = require('../middleware/upload');
const ImageProcessor = require('../utils/imageProcessor');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const path = require('path');
const fs = require('fs');

const imageProcessor = new ImageProcessor();

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (user) {
            // Remove sensitive fields
            const {
                id, username, email, role, is_verified,
                bio, location, website, github_url, linkedin_url, twitter_url,
                profile_picture, createdAt, updatedAt
            } = user;
            
            res.json({
                id, username, email, role, is_verified,
                bio, location, website, github_url, linkedin_url, twitter_url,
                profile_picture: profile_picture ? `/uploads/profiles/${path.basename(profile_picture)}` : null,
                createdAt, updatedAt
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const {
            username, email, bio, location, website,
            github_url, linkedin_url, twitter_url
        } = req.body;

        // Prepare update object with only provided fields
        const updateData = {};
        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (bio !== undefined) updateData.bio = bio;
        if (location !== undefined) updateData.location = location;
        if (website !== undefined) updateData.website = website;
        if (github_url !== undefined) updateData.github_url = github_url;
        if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
        if (twitter_url !== undefined) updateData.twitter_url = twitter_url;

        await user.update(updateData);
        
        // Return updated profile (reuse getProfile logic)
        const {
            id, username: uname, email: uemail, role, is_verified,
            bio: ubio, location: ulocation, website: uwebsite,
            github_url: ugithub, linkedin_url: ulinkedin, twitter_url: utwitter,
            profile_picture, createdAt, updatedAt
        } = user;
        
        res.json({
            id, username: uname, email: uemail, role, is_verified,
            bio: ubio, location: ulocation, website: uwebsite,
            github_url: ugithub, linkedin_url: ulinkedin, twitter_url: utwitter,
            profile_picture: profile_picture ? `/uploads/profiles/${path.basename(profile_picture)}` : null,
            createdAt, updatedAt
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

/**
 * Upload profile picture
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return sendError(res, 'No file uploaded', 400);
        }

        const user = await User.findByPk(req.userId);
        if (!user) {
            // Delete the uploaded file if user not found
            deleteUploadedFile(req.file.path);
            return sendError(res, 'User not found', 404);
        }

        // Read uploaded file
        const fileBuffer = fs.readFileSync(req.file.path);

        // Validate image
        const validation = await imageProcessor.validateImage(fileBuffer, req.file.originalname);
        if (!validation.isValid) {
            deleteUploadedFile(req.file.path);
            return sendError(res, validation.errors.join(', '), 400);
        }

        // Delete old profile pictures if they exist
        if (user.profile_picture) {
            const oldBasename = path.parse(user.profile_picture).name;
            const profilesDir = path.join(__dirname, '../../uploads/profiles');
            await imageProcessor.deleteProcessedImages(profilesDir, oldBasename);
        }

        // Process image with multiple sizes
        const filename = `profile_${user.id}_${Date.now()}`;
        const outputDir = path.join(__dirname, '../../uploads/profiles');
        
        const processResult = await imageProcessor.processProfilePicture(
            fileBuffer,
            outputDir,
            filename
        );

        // Clean up original uploaded file
        deleteUploadedFile(req.file.path);

        // Update user with new profile picture path
        await user.update({ 
            profile_picture: processResult.original.relativePath
        });

        return sendSuccess(res, {
            profile_picture: `/uploads/profiles/${filename}.webp`,
            thumbnails: {
                small: `/uploads/profiles/${filename}_small.webp`,
                medium: `/uploads/profiles/${filename}_medium.webp`,
                large: `/uploads/profiles/${filename}_large.webp`
            },
            metadata: {
                format: processResult.metadata.format,
                width: processResult.metadata.width,
                height: processResult.metadata.height,
                size: fileBuffer.length,
                processedSize: {
                    original: processResult.original.format,
                    thumbnails: Object.keys(processResult.thumbnails).length
                }
            }
        }, 'Profile picture uploaded and processed successfully');

    } catch (error) {
        // Delete the uploaded file if there's an error
        if (req.file) {
            deleteUploadedFile(req.file.path);
        }
        return sendError(res, `Image processing failed: ${error.message}`, 500);
    }
};

/**
 * Delete profile picture
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteProfilePicture = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.profile_picture) {
            return res.status(400).json({ error: 'No profile picture to delete' });
        }

        // Delete the file from filesystem
        const filePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profile_picture));
        deleteUploadedFile(filePath);

        // Update user record
        await user.update({ profile_picture: null });

        res.json({ message: 'Profile picture deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
