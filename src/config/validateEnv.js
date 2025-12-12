/**
 * Environment variable validation
 */
const logger = require('../utils/logger');

/**
 * Validate required environment variables
 */
function validateEnv() {
    const required = [];
    const warnings = [];
    
    // Only validate in non-test environments
    if (process.env.NODE_ENV !== 'test') {
        if (!process.env.JWT_SECRET) {
            required.push('JWT_SECRET');
        }
        
        // Email configuration is optional but warn if incomplete
        const emailVars = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS'];
        // eslint-disable-next-line security/detect-object-injection
        const emailVarsSet = emailVars.filter(v => process.env[v]);
        
        if (emailVarsSet.length > 0 && emailVarsSet.length < emailVars.length) {
            // eslint-disable-next-line security/detect-object-injection
            const missing = emailVars.filter(v => !process.env[v]);
            warnings.push({
                message: 'Incomplete email configuration',
                set: emailVarsSet,
                missing
            });
        }
    }
    
    // Log warnings
    warnings.forEach(warning => {
        logger.warn(warning.message, { set: warning.set, missing: warning.missing });
    });
    
    // Fail on required variables
    if (required.length > 0) {
        logger.error('Missing required environment variables', { variables: required });
        throw new Error(`Missing required environment variables: ${required.join(', ')}`);
    }
    
    if (process.env.NODE_ENV !== 'test') {
        logger.info('Environment variables validated successfully');
    }
}

module.exports = validateEnv;
