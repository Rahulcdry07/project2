const bcrypt = require('bcrypt');
const { User } = require('../models');
const logger = require('./logger');
const {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_USERNAME,
  DEFAULT_ADMIN_PASSWORD,
  RESET_ADMIN_PASSWORD
} = require('../config/env');

/**
 * Ensure there is an admin user available for bootstrapping the platform.
 * Creates or updates the default admin based on environment variables.
 */
const ensureAdminUser = async () => {
  const email = DEFAULT_ADMIN_EMAIL.toLowerCase();

  try {
    let adminUser = await User.findOne({ where: { email } });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      adminUser = await User.create({
        username: DEFAULT_ADMIN_USERNAME,
        email,
        password: hashedPassword,
        role: 'admin',
        is_verified: true,
        verification_token: null
      });
      logger.info('Default admin user created automatically.', { email });
      return adminUser;
    }

    let hasChanges = false;

    if (adminUser.username !== DEFAULT_ADMIN_USERNAME) {
      adminUser.username = DEFAULT_ADMIN_USERNAME;
      hasChanges = true;
    }

    if (adminUser.role !== 'admin') {
      adminUser.role = 'admin';
      hasChanges = true;
    }

    if (!adminUser.is_verified) {
      adminUser.is_verified = true;
      hasChanges = true;
    }

    if (RESET_ADMIN_PASSWORD) {
      adminUser.password = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      hasChanges = true;
    }

    if (hasChanges) {
      await adminUser.save();
      logger.info('Default admin user synchronized with configuration.', { email });
    } else {
      logger.debug('Default admin user already up to date.', { email });
    }

    return adminUser;
  } catch (error) {
    logger.error('Failed to ensure default admin user.', { error: error.message });
    throw error;
  }
};

module.exports = ensureAdminUser;
