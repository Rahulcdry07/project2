'use strict';

/**
 * Seeder: Create Test Users
 */
module.exports = {
  up: async (queryInterface, _Sequelize) => {
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);

    // Create 10 test users
    const users = [];
    for (let i = 1; i <= 10; i++) {
      const hashedPassword = await bcrypt.hash(`Password${i}!`, salt);
      users.push({
        username: `testuser${i}`,
        email: `testuser${i}@example.com`,
        password: hashedPassword,
        role: i === 1 ? 'admin' : 'user', // Make the first user an admin
        is_verified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return queryInterface.bulkInsert('Users', users);
  },

  down: async (queryInterface, Sequelize) => {
    // Match all test users
    return queryInterface.bulkDelete('Users', {
      email: {
        [Sequelize.Op.like]: 'testuser%@example.com',
      },
    });
  },
};
