const nodemailer = require('nodemailer');
const templates = require('./emailTemplates.js');
const logger = require('./logger.js');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Send email with error handling and logging
  async sendEmail(to, subject, html, options = {}) {
    try {
      if (process.env.NODE_ENV === 'test') {
        logger.info('Test environment: Skipping email send', { 
          to, 
          subject, 
          template: options.template || 'custom' 
        });
        return { success: true, message: 'Email would have been sent in production' };
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'no-reply@yourdomain.com',
        to,
        subject,
        html,
        ...options
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId,
        template: options.template || 'custom'
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Email send failed', {
        to,
        subject,
        error: error.message,
        template: options.template || 'custom'
      });
      
      return { success: false, error: error.message };
    }
  }

  // Welcome email after registration
  async sendWelcomeEmail(user, verificationLink) {
    const html = templates.welcome(user.username, verificationLink);
    return this.sendEmail(
      user.email,
      'Welcome to Our Platform!',
      html,
      { template: 'welcome' }
    );
  }

  // Email verification success
  async sendVerificationSuccessEmail(user) {
    const html = templates.verificationSuccess(user.username);
    return this.sendEmail(
      user.email,
      'Email Verification Successful',
      html,
      { template: 'verificationSuccess' }
    );
  }

  // Password reset email
  async sendPasswordResetEmail(user, resetLink) {
    const html = templates.passwordReset(user.username, resetLink);
    return this.sendEmail(
      user.email,
      'Password Reset Request',
      html,
      { template: 'passwordReset' }
    );
  }

  // Password changed notification
  async sendPasswordChangedEmail(user, ipAddress) {
    const timestamp = new Date().toLocaleString();
    const html = templates.passwordChanged(user.username, timestamp, ipAddress);
    return this.sendEmail(
      user.email,
      'Password Changed Successfully',
      html,
      { template: 'passwordChanged' }
    );
  }

  // Profile update notification
  async sendProfileUpdatedEmail(user, changes) {
    const html = templates.profileUpdated(user.username, changes);
    return this.sendEmail(
      user.email,
      'Profile Updated Successfully',
      html,
      { template: 'profileUpdated' }
    );
  }

  // Profile picture updated notification
  async sendProfilePictureUpdatedEmail(user) {
    const html = templates.profilePictureUpdated(user.username);
    return this.sendEmail(
      user.email,
      'Profile Picture Updated',
      html,
      { template: 'profilePictureUpdated' }
    );
  }

  // New device login alert
  async sendNewDeviceLoginEmail(user, deviceInfo) {
    const timestamp = new Date().toLocaleString();
    const html = templates.newDeviceLogin(user.username, deviceInfo, timestamp);
    return this.sendEmail(
      user.email,
      'New Device Login Alert',
      html,
      { template: 'newDeviceLogin' }
    );
  }

  // Security alert
  async sendSecurityAlertEmail(user, alertType, details) {
    const html = templates.securityAlert(user.username, alertType, details);
    return this.sendEmail(
      user.email,
      'Security Alert',
      html,
      { template: 'securityAlert' }
    );
  }

  // Weekly activity summary
  async sendWeeklySummaryEmail(user, stats) {
    const html = templates.weeklySummary(user.username, stats);
    return this.sendEmail(
      user.email,
      'Your Weekly Activity Summary',
      html,
      { template: 'weeklySummary' }
    );
  }

  // Admin notification for new user
  async sendAdminNewUserEmail(adminUser, newUser) {
    const html = templates.adminNewUser(adminUser.username, newUser);
    return this.sendEmail(
      adminUser.email,
      'New User Registration',
      html,
      { template: 'adminNewUser' }
    );
  }

  // Bulk email sending with rate limiting
  async sendBulkEmails(emails, template, dataGenerator) {
    const results = [];
    const batchSize = 10; // Send 10 emails at a time
    const delay = 1000; // 1 second delay between batches

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (email) => {
        try {
          const data = dataGenerator(email);
          const html = templates[template](...data);
          return await this.sendEmail(
            email,
            data.subject || 'Notification',
            html,
            { template }
          );
        } catch (error) {
          logger.error('Bulk email send failed', { email, error: error.message });
          return { success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to avoid rate limiting
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  // Test email service
  async testEmailService() {
    try {
      const testHtml = `
        <h2>Email Service Test</h2>
        <p>This is a test email to verify the email service is working correctly.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `;

      const result = await this.sendEmail(
        process.env.TEST_EMAIL || 'test@example.com',
        'Email Service Test',
        testHtml,
        { template: 'test' }
      );

      return result;
    } catch (error) {
      logger.error('Email service test failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  // Get email statistics
  async getEmailStats() {
    // This would typically query a database for email statistics
    // For now, return mock data
    return {
      totalSent: 0,
      totalFailed: 0,
      successRate: 100,
      lastSent: null,
      templates: Object.keys(templates)
    };
  }
}

module.exports = EmailService; 