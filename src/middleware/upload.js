/**
 * File upload middleware using multer
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directories exist
const createUploadDirs = () => {
    const dirs = [
        path.join(__dirname, '../../uploads'),
        path.join(__dirname, '../../uploads/profiles'),
        path.join(__dirname, '../../uploads/documents'),
        path.join(__dirname, '../../uploads/temp')
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Storage configuration for profile images
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/profiles'));
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const hash = crypto.createHash('md5').update(req.user.id.toString()).digest('hex').substring(0, 8);
        cb(null, `profile-${hash}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Storage configuration for documents
const documentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads/documents'));
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const hash = crypto.createHash('md5').update(req.user.id.toString()).digest('hex').substring(0, 8);
        cb(null, `doc-${hash}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
    const { validateFileName } = require('./fileSecurity');
    
    // Validate filename first
    if (!validateFileName(file.originalname)) {
        return cb(new Error('Invalid filename. Please use a safe filename without special characters.'), false);
    }
    
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// File filter for documents
const documentFileFilter = (req, file, cb) => {
    const { validateFileName } = require('./fileSecurity');
    
    // Validate filename first
    if (!validateFileName(file.originalname)) {
        return cb(new Error('Invalid filename. Please use a safe filename without special characters.'), false);
    }
    
    // Accept PDF, DOC, DOCX files
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed!'), false);
    }
};

// Profile image upload configuration
const uploadProfileImage = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    },
    fileFilter: imageFileFilter
});

// Document upload configuration
const uploadDocument = multer({
    storage: documentStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    },
    fileFilter: documentFileFilter
});

// Generic upload configuration with more flexible settings
const uploadGeneric = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../../uploads/temp'));
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
        files: 5
    }
});

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({ 
                    error: 'File too large. Maximum size allowed is based on upload type.' 
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({ 
                    error: 'Too many files. Please upload one file at a time.' 
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({ 
                    error: 'Unexpected field name for file upload.' 
                });
            default:
                return res.status(400).json({ 
                    error: `File upload error: ${err.message}` 
                });
        }
    }
    
    if (err) {
        return res.status(400).json({ 
            error: err.message 
        });
    }
    
    next();
};

// Helper function to delete uploaded file
const deleteUploadedFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }
};

// Helper function to get file size in human readable format
const getFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Middleware to validate uploaded files
const validateUploadedFile = (req, res, next) => {
    if (!req.file && !req.files) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Perform additional security checks
    const { validateFileSignature, scanFileContent } = require('./fileSecurity');
    
    if (req.file) {
        // Validate file signature
        if (!validateFileSignature(req.file.path, req.file.mimetype)) {
            deleteUploadedFile(req.file.path);
            return res.status(400).json({ 
                error: 'File type validation failed. The file content does not match its declared type.' 
            });
        }
        
        // Scan file content for malicious patterns
        if (!scanFileContent(req.file.path, req.file.mimetype)) {
            deleteUploadedFile(req.file.path);
            return res.status(400).json({ 
                error: 'File content validation failed. The file contains potentially harmful content.' 
            });
        }
    }
    
    next();
};

module.exports = {
    uploadProfileImage,
    uploadDocument,
    uploadGeneric,
    handleMulterError,
    deleteUploadedFile,
    getFileSize,
    validateUploadedFile
};