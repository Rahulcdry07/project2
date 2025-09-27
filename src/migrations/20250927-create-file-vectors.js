'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FileVectors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: false
      },
      original_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content_text: {
        type: Sequelize.TEXT
      },
      page_count: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      embedding_vector: {
        type: Sequelize.TEXT
      },
      embedding_model: {
        type: Sequelize.STRING,
        defaultValue: 'sentence-transformers/all-MiniLM-L6-v2'
      },
      processed_at: {
        type: Sequelize.DATE
      },
      processing_status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        defaultValue: 'pending'
      },
      error_message: {
        type: Sequelize.TEXT
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('FileVectors', ['user_id']);
    await queryInterface.addIndex('FileVectors', ['processing_status']);
    await queryInterface.addIndex('FileVectors', ['processed_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('FileVectors');
  }
};