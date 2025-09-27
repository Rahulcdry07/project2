'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new profile fields to Users table
    await queryInterface.addColumn('Users', 'refresh_token', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'refresh_token_expires_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'profile_picture', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'bio', {
      type: Sequelize.TEXT(500),
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'location', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'website', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'github_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'linkedin_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Users', 'twitter_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the added columns
    await queryInterface.removeColumn('Users', 'refresh_token');
    await queryInterface.removeColumn('Users', 'refresh_token_expires_at');
    await queryInterface.removeColumn('Users', 'profile_picture');
    await queryInterface.removeColumn('Users', 'bio');
    await queryInterface.removeColumn('Users', 'location');
    await queryInterface.removeColumn('Users', 'website');
    await queryInterface.removeColumn('Users', 'github_url');
    await queryInterface.removeColumn('Users', 'linkedin_url');
    await queryInterface.removeColumn('Users', 'twitter_url');
  }
};