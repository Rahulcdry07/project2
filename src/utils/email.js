/**
 * Email service utilities
 */
const nodemailer = require('nodemailer');
const { EMAIL_CONFIG, NODE_ENV, CLIENT_URL } = require('../config/env');

// Set up the email transporter based on environment
const transporter = NODE_ENV === 'test' 
  ? {
      // Mock transporter for testing
      sendMail: (mailOptions) => {
        console.log('Test mode - email would be sent:', mailOptions);
        return Promise.resolve({ messageId: 'test-message-id' });
      }
    }
  : nodemailer.createTransport(EMAIL_CONFIG);

/**
 * Send a verification email to a new user
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 * @returns {Promise} - Result of email sending
 */
const sendVerificationEmail = async (email, token) => {
    const verificationLink = `${CLIENT_URL}/verify-email.html?token=${token}`;
    try {
        return await transporter.sendMail({
            from: 'no-reply@yourdomain.com',
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Please verify your email by clicking on this link: <a href="${verificationLink}">${verificationLink}</a></p>`,
        });
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { error: error.message };
    }
};

/**
 * Send a password reset email
 * @param {string} email - User's email address
 * @param {string} token - Reset token
 * @returns {Promise} - Result of email sending
 */
const sendPasswordResetEmail = async (email, token) => {
    const resetLink = `${CLIENT_URL}/reset-password.html?token=${token}`;
    try {
        return await transporter.sendMail({
            from: 'no-reply@yourdomain.com',
            to: email,
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset. Please click this link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
        });
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return { error: error.message };
    }
};

module.exports = {
    transporter,
    sendVerificationEmail,
    sendPasswordResetEmail
};