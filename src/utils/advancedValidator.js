/**
 * Enhanced validation utilities with advanced security checks
 */
const validator = require('validator');
const { body, param, query } = require('express-validator');
const logger = require('../utils/logger');

class AdvancedValidator {
    constructor() {
        this.bannedWords = [
            'admin', 'administrator', 'root', 'superuser', 'sudo',
            'test', 'guest', 'anonymous', 'null', 'undefined'
        ];
        
        this.suspiciousPatterns = [
            /script/i, /javascript/i, /vbscript/i, /onload/i, /onerror/i,
            /<script/i, /<iframe/i, /<object/i, /<embed/i,
            /eval\(/i, /function\(/i, /setTimeout/i, /setInterval/i
        ];
        
        this.sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
            /(UNION|OR|AND)\s+\d+\s*=\s*\d+/i,
            /'\s*(OR|AND)\s+'\w*'\s*=\s*'\w*'/i,
            /(--|\/\*|\*\/)/,
            /\b(CHAR|CONCAT|SUBSTRING|ASCII)\b/i
        ];
    }

    /**
     * Enhanced username validation with security checks
     * @param {string} username - Username to validate
     * @returns {Object} Validation result
     */
    validateUsername(username) {
        const result = {
            isValid: true,
            errors: []
        };

        // Basic format check
        if (!username || typeof username !== 'string') {
            result.isValid = false;
            result.errors.push('Username is required');
            return result;
        }

        // Length check
        if (username.length < 3 || username.length > 50) {
            result.isValid = false;
            result.errors.push('Username must be between 3 and 50 characters');
        }

        // Character check
        if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
            result.isValid = false;
            result.errors.push('Username can only contain letters, numbers, underscores, dots, and hyphens');
        }

        // Check for banned words
        const lowerUsername = username.toLowerCase();
        for (const banned of this.bannedWords) {
            if (lowerUsername.includes(banned)) {
                result.isValid = false;
                result.errors.push('Username contains restricted words');
                break;
            }
        }

        // Check for suspicious patterns
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(username)) {
                result.isValid = false;
                result.errors.push('Username contains suspicious content');
                logger.warn('Suspicious username detected', { username, pattern: pattern.toString() });
                break;
            }
        }

        // Check for sequential numbers or repeated characters
        if (/(.)\1{3,}/.test(username)) {
            result.isValid = false;
            result.errors.push('Username cannot contain more than 3 consecutive identical characters');
        }

        // Check for valid start/end characters
        if (!/^[a-zA-Z0-9]/.test(username) || !/[a-zA-Z0-9]$/.test(username)) {
            result.isValid = false;
            result.errors.push('Username must start and end with alphanumeric characters');
        }

        return result;
    }

    /**
     * Enhanced email validation with domain checks
     * @param {string} email - Email to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateEmail(email) {
        const result = {
            isValid: true,
            errors: []
        };

        // Basic format check
        if (!email || typeof email !== 'string') {
            result.isValid = false;
            result.errors.push('Email is required');
            return result;
        }

        // Length check
        if (email.length > 320) {
            result.isValid = false;
            result.errors.push('Email address is too long');
        }

        // Basic email format validation
        if (!validator.isEmail(email)) {
            result.isValid = false;
            result.errors.push('Invalid email format');
            return result;
        }

        // Check for suspicious patterns
        for (const pattern of this.suspiciousPatterns) {
            if (pattern.test(email)) {
                result.isValid = false;
                result.errors.push('Email contains suspicious content');
                logger.warn('Suspicious email detected', { email, pattern: pattern.toString() });
                break;
            }
        }

        // Extract domain and validate
        const domain = email.split('@')[1];
        if (domain) {
            // Check for valid domain format
            if (!validator.isFQDN(domain)) {
                result.isValid = false;
                result.errors.push('Invalid email domain');
            }

            // Check for disposable email domains (basic list)
            const disposableDomains = [
                '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
                'mailinator.com', 'throwaway.email', 'temp-mail.org'
            ];
            
            if (disposableDomains.includes(domain.toLowerCase())) {
                result.isValid = false;
                result.errors.push('Disposable email addresses are not allowed');
            }
        }

        return result;
    }

    /**
     * Enhanced password validation with complexity scoring
     * @param {string} password - Password to validate
     * @returns {Object} Validation result with complexity score
     */
    validatePassword(password) {
        const result = {
            isValid: true,
            errors: [],
            score: 0,
            strength: 'weak'
        };

        if (!password || typeof password !== 'string') {
            result.isValid = false;
            result.errors.push('Password is required');
            return result;
        }

        let score = 0;

        // Length scoring
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;

        // Character variety scoring
        if (/[a-z]/.test(password)) score += 1; // lowercase
        if (/[A-Z]/.test(password)) score += 1; // uppercase
        if (/[0-9]/.test(password)) score += 1; // numbers
        if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special characters

        // Advanced patterns
        if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) score += 1;
        if (/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) score += 1;

        // Penalize common patterns
        if (/(.)\1{2,}/.test(password)) score -= 1; // repeated characters
        if (/012|123|234|345|456|567|678|789|890/.test(password)) score -= 1; // sequential numbers
        if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password)) score -= 1; // sequential letters

        // Common password patterns
        const commonPatterns = [
            /password/i, /123456/, /qwerty/i, /admin/i, /login/i,
            /welcome/i, /master/i, /secret/i, /default/i
        ];

        for (const pattern of commonPatterns) {
            if (pattern.test(password)) {
                score -= 2;
                result.errors.push('Password contains common patterns');
                break;
            }
        }

        result.score = Math.max(0, Math.min(10, score));

        // Determine strength
        if (result.score >= 8) result.strength = 'very strong';
        else if (result.score >= 6) result.strength = 'strong';
        else if (result.score >= 4) result.strength = 'moderate';
        else if (result.score >= 2) result.strength = 'weak';
        else result.strength = 'very weak';

        // Minimum requirements
        if (password.length < 8) {
            result.isValid = false;
            result.errors.push('Password must be at least 8 characters long');
        }

        if (result.score < 4) {
            result.isValid = false;
            result.errors.push(`Password is too weak (${result.strength}). Use a mix of uppercase, lowercase, numbers, and special characters.`);
        }

        return result;
    }

    /**
     * Validate text input for XSS and injection attacks
     * @param {string} input - Text input to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateTextInput(input, options = {}) {
        const {
            maxLength = 1000,
            allowHTML = false,
            allowSpecialChars = true,
            fieldName = 'input'
        } = options;

        const result = {
            isValid: true,
            errors: []
        };

        if (typeof input !== 'string') {
            result.isValid = false;
            result.errors.push(`${fieldName} must be a string`);
            return result;
        }

        // Length check
        if (input.length > maxLength) {
            result.isValid = false;
            result.errors.push(`${fieldName} exceeds maximum length of ${maxLength} characters`);
        }

        // HTML/Script injection check
        if (!allowHTML) {
            for (const pattern of this.suspiciousPatterns) {
                if (pattern.test(input)) {
                    result.isValid = false;
                    result.errors.push(`${fieldName} contains potentially harmful content`);
                    logger.warn('Suspicious input detected', { 
                        fieldName, 
                        input: input.substring(0, 100),
                        pattern: pattern.toString() 
                    });
                    break;
                }
            }
        }

        // SQL injection check
        for (const pattern of this.sqlPatterns) {
            if (pattern.test(input)) {
                result.isValid = false;
                result.errors.push(`${fieldName} contains potentially harmful SQL patterns`);
                logger.warn('SQL injection attempt detected', { 
                    fieldName, 
                    input: input.substring(0, 100),
                    pattern: pattern.toString() 
                });
                break;
            }
        }

        // Special character check
        if (!allowSpecialChars && /[<>\"'&]/.test(input)) {
            result.isValid = false;
            result.errors.push(`${fieldName} contains disallowed special characters`);
        }

        return result;
    }

    /**
     * Validate URL with security checks
     * @param {string} url - URL to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateURL(url, options = {}) {
        const {
            allowedProtocols = ['http', 'https'],
            allowLocalhost = false,
            maxLength = 2048
        } = options;

        const result = {
            isValid: true,
            errors: []
        };

        if (!url || typeof url !== 'string') {
            result.isValid = false;
            result.errors.push('URL is required');
            return result;
        }

        // Length check
        if (url.length > maxLength) {
            result.isValid = false;
            result.errors.push(`URL exceeds maximum length of ${maxLength} characters`);
        }

        // Basic URL format validation
        if (!validator.isURL(url, { 
            protocols: allowedProtocols,
            require_protocol: true 
        })) {
            result.isValid = false;
            result.errors.push('Invalid URL format');
            return result;
        }

        try {
            const urlObj = new URL(url);
            
            // Protocol check
            const protocol = urlObj.protocol.replace(':', '');
            if (!allowedProtocols.includes(protocol)) {
                result.isValid = false;
                result.errors.push('URL protocol not allowed');
            }

            // Localhost check
            if (!allowLocalhost && (
                urlObj.hostname === 'localhost' ||
                urlObj.hostname === '127.0.0.1' ||
                urlObj.hostname.startsWith('192.168.') ||
                urlObj.hostname.startsWith('10.') ||
                urlObj.hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)
            )) {
                result.isValid = false;
                result.errors.push('Local URLs are not allowed');
            }

            // Check for suspicious patterns in URL
            for (const pattern of this.suspiciousPatterns) {
                if (pattern.test(url)) {
                    result.isValid = false;
                    result.errors.push('URL contains suspicious content');
                    logger.warn('Suspicious URL detected', { url, pattern: pattern.toString() });
                    break;
                }
            }
        } catch (error) {
            result.isValid = false;
            result.errors.push('Invalid URL format');
        }

        return result;
    }

    /**
     * Validate file name for security
     * @param {string} filename - Filename to validate
     * @returns {Object} Validation result
     */
    validateFilename(filename) {
        const result = {
            isValid: true,
            errors: []
        };

        if (!filename || typeof filename !== 'string') {
            result.isValid = false;
            result.errors.push('Filename is required');
            return result;
        }

        // Length check
        if (filename.length > 255) {
            result.isValid = false;
            result.errors.push('Filename is too long (max 255 characters)');
        }

        // Path traversal check
        if (/\.\.\/|\.\.\\|\.\.\.|\/\.\.|\\\.\./.test(filename)) {
            result.isValid = false;
            result.errors.push('Filename contains path traversal patterns');
            logger.warn('Path traversal attempt in filename', { filename });
        }

        // Dangerous characters check
        if (/[<>:"|?*\x00-\x1f]/.test(filename)) {
            result.isValid = false;
            result.errors.push('Filename contains invalid characters');
        }

        // Reserved names check (Windows)
        const reservedNames = [
            'CON', 'PRN', 'AUX', 'NUL',
            'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
            'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
        ];

        const nameWithoutExt = filename.split('.')[0].toUpperCase();
        if (reservedNames.includes(nameWithoutExt)) {
            result.isValid = false;
            result.errors.push('Filename uses reserved system name');
        }

        return result;
    }

    /**
     * Create express-validator chain for enhanced validation
     * @param {string} field - Field name
     * @param {string} type - Validation type
     * @param {Object} options - Validation options
     * @returns {Array} Validation chain
     */
    createValidationChain(field, type, options = {}) {
        let chain;

        switch (type) {
            case 'username':
                chain = body(field)
                    .custom(async (value) => {
                        const result = this.validateUsername(value);
                        if (!result.isValid) {
                            throw new Error(result.errors.join(', '));
                        }
                        return true;
                    });
                break;

            case 'email':
                chain = body(field)
                    .custom(async (value) => {
                        const result = await this.validateEmail(value);
                        if (!result.isValid) {
                            throw new Error(result.errors.join(', '));
                        }
                        return true;
                    });
                break;

            case 'password':
                chain = body(field)
                    .custom(async (value) => {
                        const result = this.validatePassword(value);
                        if (!result.isValid) {
                            throw new Error(result.errors.join(', '));
                        }
                        return true;
                    });
                break;

            case 'text':
                chain = body(field)
                    .custom(async (value) => {
                        const result = this.validateTextInput(value, { 
                            ...options, 
                            fieldName: field 
                        });
                        if (!result.isValid) {
                            throw new Error(result.errors.join(', '));
                        }
                        return true;
                    });
                break;

            case 'url':
                chain = body(field)
                    .optional()
                    .custom(async (value) => {
                        if (value) {
                            const result = this.validateURL(value, options);
                            if (!result.isValid) {
                                throw new Error(result.errors.join(', '));
                            }
                        }
                        return true;
                    });
                break;

            default:
                throw new Error(`Unsupported validation type: ${type}`);
        }

        return chain;
    }
}

module.exports = AdvancedValidator;