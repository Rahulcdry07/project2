'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add personal information fields to Users table
    await queryInterface.addColumn('Users', 'first_name', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'last_name', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'phone', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'date_of_birth', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the added columns
    await queryInterface.removeColumn('Users', 'first_name');
    await queryInterface.removeColumn('Users', 'last_name');
    await queryInterface.removeColumn('Users', 'phone');
    await queryInterface.removeColumn('Users', 'date_of_birth');
  }
};