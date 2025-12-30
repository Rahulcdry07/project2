'use strict';
const bcrypt = require('bcrypt');

/**
 * Seeder: Create Default Admin User
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingUsers = await queryInterface.sequelize.query(
      'SELECT id FROM "Users" WHERE email = :email LIMIT 1',
      {
        replacements: { email: 'admin@example.com' },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingUsers.length > 0) {
      return Promise.resolve();
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    return queryInterface.bulkInsert('Users', [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        is_verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, _Sequelize) => {
    return queryInterface.bulkDelete('Users', { 
      email: 'admin@example.com' 
    });
  }
};