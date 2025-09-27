/**
 * Migration: Add database indexes for performance optimization
 * Date: 2025-09-27
 */

'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        
        try {
            // User table indexes
            await queryInterface.addIndex('Users', ['email'], {
                unique: true,
                name: 'idx_users_email',
                transaction
            });

            await queryInterface.addIndex('Users', ['username'], {
                unique: true,
                name: 'idx_users_username',
                transaction
            });

            await queryInterface.addIndex('Users', ['verification_token'], {
                name: 'idx_users_verification_token',
                transaction
            });

            await queryInterface.addIndex('Users', ['reset_token'], {
                name: 'idx_users_reset_token',
                transaction
            });

            await queryInterface.addIndex('Users', ['refresh_token_expires_at'], {
                name: 'idx_users_refresh_token_expires',
                transaction
            });

            await queryInterface.addIndex('Users', ['role'], {
                name: 'idx_users_role',
                transaction
            });

            await queryInterface.addIndex('Users', ['is_verified'], {
                name: 'idx_users_is_verified',
                transaction
            });

            await queryInterface.addIndex('Users', ['createdAt'], {
                name: 'idx_users_created_at',
                transaction
            });

            // FileVector table indexes
            await queryInterface.addIndex('FileVectors', ['user_id'], {
                name: 'idx_file_vectors_user_id',
                transaction
            });

            await queryInterface.addIndex('FileVectors', ['processing_status'], {
                name: 'idx_file_vectors_processing_status',
                transaction
            });

            await queryInterface.addIndex('FileVectors', ['mime_type'], {
                name: 'idx_file_vectors_mime_type',
                transaction
            });

            await queryInterface.addIndex('FileVectors', ['processed_at'], {
                name: 'idx_file_vectors_processed_at',
                transaction
            });

            await queryInterface.addIndex('FileVectors', ['createdAt'], {
                name: 'idx_file_vectors_created_at',
                transaction
            });

            // Composite indexes for common query patterns
            await queryInterface.addIndex('FileVectors', ['user_id', 'processing_status'], {
                name: 'idx_file_vectors_user_status',
                transaction
            });

            await queryInterface.addIndex('FileVectors', ['user_id', 'mime_type'], {
                name: 'idx_file_vectors_user_mime',
                transaction
            });

            await queryInterface.addIndex('FileVectors', ['processing_status', 'processed_at'], {
                name: 'idx_file_vectors_status_processed',
                transaction
            });

            // Full-text search index for content_text (SQLite FTS)
            // Note: SQLite doesn't support traditional full-text indexes like PostgreSQL
            // For production, consider using PostgreSQL with GIN/GiST indexes
            await queryInterface.addIndex('FileVectors', ['content_text'], {
                name: 'idx_file_vectors_content_text',
                transaction
            });

            await transaction.commit();
            console.log('Database indexes created successfully');
        } catch (error) {
            await transaction.rollback();
            console.error('Error creating database indexes:', error);
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        
        try {
            // Remove User table indexes
            await queryInterface.removeIndex('Users', 'idx_users_email', { transaction });
            await queryInterface.removeIndex('Users', 'idx_users_username', { transaction });
            await queryInterface.removeIndex('Users', 'idx_users_verification_token', { transaction });
            await queryInterface.removeIndex('Users', 'idx_users_reset_token', { transaction });
            await queryInterface.removeIndex('Users', 'idx_users_refresh_token_expires', { transaction });
            await queryInterface.removeIndex('Users', 'idx_users_role', { transaction });
            await queryInterface.removeIndex('Users', 'idx_users_is_verified', { transaction });
            await queryInterface.removeIndex('Users', 'idx_users_created_at', { transaction });

            // Remove FileVector table indexes
            await queryInterface.removeIndex('FileVectors', 'idx_file_vectors_user_id', { transaction });
            await queryInterface.removeIndex('FileVectors', 'idx_file_vectors_processing_status', { transaction });
            await queryInterface.removeIndex('FileVectors', 'idx_file_vectors_mime_type', { transaction });
            await queryInterface.removeIndex('FileVectors', 'idx_file_vectors_processed_at', { transaction });
            await queryInterface.removeIndex('FileVectors', 'idx_file_vectors_created_at', { transaction });
            await queryInterface.removeIndex('FileVectors', 'idx_file_vectors_user_status', { transaction });
            await queryInterface.removeIndex('FileVectors', 'idx_file_vectors_user_mime', { transaction });
            await queryInterface.removeIndex('FileVectors', 'idx_file_vectors_status_processed', { transaction });
            await queryInterface.removeIndex('FileVectors', 'idx_file_vectors_content_text', { transaction });

            await transaction.commit();
            console.log('Database indexes removed successfully');
        } catch (error) {
            await transaction.rollback();
            console.error('Error removing database indexes:', error);
            throw error;
        }
    }
};