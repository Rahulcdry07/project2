'use strict';

/**
 * Seeder: Create Test Users
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    
    // Create 10 test users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      const hashedPassword = await bcrypt.hash(`password${i}`, salt);
      users.push({
        username: `testuser${i}`,
        email: `testuser${i}@example.com`,
        password: hashedPassword,
        role: i === 1 ? 'admin' : 'user', // Make the first user an admin
        is_verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const emails = users.map(user => user.email);
    const existingUsers = await queryInterface.sequelize.query(
      'SELECT email FROM "Users" WHERE email IN (:emails)',
      {
        replacements: { emails },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const existingEmails = new Set(existingUsers.map(user => user.email));
    const usersToInsert = users.filter(user => !existingEmails.has(user.email));
    
    if (usersToInsert.length === 0) {
      return Promise.resolve();
    }
    
    return queryInterface.bulkInsert('Users', usersToInsert);
  },

  down: async (queryInterface, Sequelize) => {
    // Match all test users
    return queryInterface.bulkDelete('Users', {
      email: {
        [Sequelize.Op.like]: 'testuser%@example.com'
      }
    });
  }
};