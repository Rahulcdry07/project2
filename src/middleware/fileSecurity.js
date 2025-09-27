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

module.exports = {
    validateFileSignature,
    scanFileContent,
    validateFileSize,
    validateFileName
};