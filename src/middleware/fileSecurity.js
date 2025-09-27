/**
 * File security utilities
 */
const fs = require('fs');
const path = require('path');

/**
 * File signature checking for better security
 */
const FILE_SIGNATURES = {
    // Images
    'image/jpeg': [['FF', 'D8', 'FF']],
    'image/png': [['89', '50', '4E', '47', '0D', '0A', '1A', '0A']],
    'image/gif': [['47', '49', '46', '38', '37', 'A'], ['47', '49', '46', '38', '39', 'A']],
    
    // Documents
    'application/pdf': [['25', '50', '44', '46']],
    'application/msword': [['D0', 'CF', '11', 'E0', 'A1', 'B1', '1A', 'E1']],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [['50', '4B', '03', '04']],
    
    // Text
    'text/plain': [] // Text files can have various encodings, so we skip signature check
};

/**
 * Check if file signature matches declared MIME type
 * @param {string} filePath - Path to the uploaded file
 * @param {string} declaredMimeType - MIME type from multer
 * @returns {boolean} - True if file is safe
 */
const validateFileSignature = (filePath, declaredMimeType) => {
    try {
        // Skip validation for text files
        if (declaredMimeType === 'text/plain') {
            return true;
        }
        
        const signatures = FILE_SIGNATURES[declaredMimeType];
        if (!signatures || signatures.length === 0) {
            return false; // Unsupported file type
        }
        
        const buffer = fs.readFileSync(filePath, { start: 0, end: 16 }); // Read first 16 bytes
        const hex = Array.from(buffer, byte => byte.toString(16).toUpperCase().padStart(2, '0'));
        
        // Check if any signature matches
        return signatures.some(signature => {
            return signature.every((byte, index) => hex[index] === byte);
        });
    } catch (error) {
        console.error('File signature validation error:', error);
        return false;
    }
};

/**
 * Scan file content for potential malicious patterns
 * @param {string} filePath - Path to the uploaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {boolean} - True if file appears safe
 */
const scanFileContent = (filePath, mimeType) => {
    try {
        // Skip binary files
        if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
            return true;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for potentially dangerous patterns
        const dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /data:.*base64/gi,
            /eval\s*\(/gi,
            /exec\s*\(/gi,
            /system\s*\(/gi,
            /shell_exec\s*\(/gi,
            /\$_GET|\$_POST|\$_REQUEST/gi,
            /<?php/gi
        ];
        
        return !dangerousPatterns.some(pattern => pattern.test(content));
    } catch (error) {
        console.error('File content scanning error:', error);
        return false;
    }
};

/**
 * Check file size limits
 * @param {number} fileSize - Size of the file in bytes
 * @param {string} fileType - Type of file (document, image)
 * @returns {boolean} - True if size is within limits
 */
const validateFileSize = (fileSize, fileType) => {
    const limits = {
        document: 10 * 1024 * 1024, // 10MB
        image: 5 * 1024 * 1024,     // 5MB
        default: 15 * 1024 * 1024   // 15MB
    };
    
    const limit = limits[fileType] || limits.default;
    return fileSize <= limit;
};

/**
 * Validate file name for security
 * @param {string} filename - Original filename
 * @returns {boolean} - True if filename is safe
 */
const validateFileName = (filename) => {
    // Check for directory traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return false;
    }
    
    // Check for null bytes
    if (filename.includes('\0')) {
        return false;
    }
    
    // Check filename length
    if (filename.length > 255) {
        return false;
    }
    
    // Check for suspicious extensions
    const dangerousExtensions = [
        '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
        '.php', '.asp', '.jsp', '.pl', '.py', '.rb',
        '.sh', '.ps1', '.vbs', '.js'
    ];
    
    const extension = path.extname(filename).toLowerCase();
    return !dangerousExtensions.includes(extension);
};

/**
 * Validate file type based on MIME type and extension
 * @param {Array|Object} allowedTypes - Array of allowed MIME types or single file object
 * @returns {Function} Middleware function
 */
function validateFileType(allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) {
    return (req, res, next) => {
        if (!req.file && !req.files) {
            return next();
        }

        let files;
        if (req.files && Array.isArray(req.files)) {
            files = req.files;
        } else if (req.file) {
            files = [req.file];
        } else {
            return next();
        }

        // MIME type to extension mapping for generic types
        const mimeToExtension = {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'text/plain': ['.txt'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        };

        for (const file of files) {
            if (file) {
                let isAllowed = allowedTypes.includes(file.mimetype);
                
                // If MIME type is generic, check file extension
                if (!isAllowed && file.mimetype === 'application/octet-stream' && file.originalname) {
                    const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
                    
                    // Check if any allowed type matches this extension
                    for (const allowedType of allowedTypes) {
                        const extensions = mimeToExtension[allowedType];
                        if (extensions && extensions.includes(extension)) {
                            isAllowed = true;
                            break;
                        }
                    }
                }
                
                if (!isAllowed) {
                    return res.status(400).json({
                        success: false,
                        message: `File type ${file.mimetype} is not allowed`
                    });
                }
            }
        }
        next();
    };
}

/**
 * Validate file size
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Function} Middleware function
 */
function validateFileSizeMiddleware(maxSize = 10 * 1024 * 1024) { // 10MB default
    return (req, res, next) => {
        if (!req.file && !req.files) {
            return next();
        }

        let files;
        if (req.files && Array.isArray(req.files)) {
            files = req.files;
        } else if (req.file) {
            files = [req.file];
        } else {
            return next();
        }

        let totalSize = 0;
        
        for (const file of files) {
            if (file && file.size > maxSize) {
                return res.status(400).json({
                    success: false,
                    message: `File ${file.originalname} exceeds maximum size of ${maxSize} bytes`
                });
            }
            if (file) {
                totalSize += file.size;
            }
        }

        if (totalSize > maxSize) {
            return res.status(400).json({
                success: false,
                message: `Total file size exceeds maximum allowed size`
            });
        }

        next();
    };
}

/**
 * Basic malware scanning (placeholder implementation)
 * @returns {Function} Middleware function
 */
function scanForMalware() {
    return (req, res, next) => {
        if (!req.file && !req.files) {
            return next();
        }

        let files;
        if (req.files && Array.isArray(req.files)) {
            files = req.files;
        } else if (req.file) {
            files = [req.file];
        } else {
            return next();
        }

        for (const file of files) {
            if (file) {
                // Basic suspicious pattern detection
                if (file.originalname.includes('.exe') || 
                    file.originalname.includes('virus') ||
                    file.originalname.includes('malware')) {
                    return res.status(400).json({
                        success: false,
                        message: 'File appears to contain suspicious content'
                    });
                }
            }
        }
        next();
    };
}

/**
 * Sanitize filename middleware to prevent path traversal and other issues
 * @returns {Function} Middleware function
 */
function sanitizeFilenameMiddleware() {
    return (req, res, next) => {
        if (!req.file && !req.files) {
            return next();
        }

        let files;
        if (req.files && Array.isArray(req.files)) {
            files = req.files;
        } else if (req.file) {
            files = [req.file];
        } else {
            return next();
        }

        for (const file of files) {
            if (file) {
                file.originalname = sanitizeFilename(file.originalname);
            }
        }
        next();
    };
}

/**
 * Sanitize filename to prevent path traversal and other issues
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    if (!filename) return 'file';
    
    // Remove path separators and dangerous characters
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\.\./g, '')
        .replace(/^\.+/, '')
        .substring(0, 255) || 'file';
}

module.exports = {
    validateFileSignature,
    scanFileContent,
    validateFileSizeHelper: validateFileSize,
    validateFileName,
    validateFileType,
    validateFileSize: validateFileSizeMiddleware,
    scanForMalware,
    sanitizeFilename: sanitizeFilenameMiddleware,
    sanitizeFilenameHelper: sanitizeFilename
};