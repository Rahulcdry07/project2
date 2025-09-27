/**
 * Database utilities for query optimization and performance monitoring
 */
const { Op, QueryTypes } = require('sequelize');
const logger = require('./logger');

class DatabaseUtils {
    constructor(sequelize) {
        this.sequelize = sequelize;
        this.queryCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Execute optimized query with caching
     * @param {string} cacheKey - Unique cache key
     * @param {Function} queryFunction - Function that returns a promise
     * @param {number} ttl - Time to live in milliseconds
     * @returns {Promise} Query result
     */
    async cachedQuery(cacheKey, queryFunction, ttl = this.cacheTimeout) {
        try {
            // Check cache first
            const cached = this.queryCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < ttl) {
                logger.debug('Query cache hit', { cacheKey });
                return cached.data;
            }

            // Execute query
            const startTime = Date.now();
            const result = await queryFunction();
            const queryTime = Date.now() - startTime;

            // Log slow queries
            if (queryTime > 1000) {
                logger.warn('Slow query detected', { 
                    cacheKey, 
                    queryTime: `${queryTime}ms` 
                });
            }

            // Cache result
            this.queryCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            // Clean old cache entries periodically
            if (this.queryCache.size > 100) {
                this.cleanCache();
            }

            return result;
        } catch (error) {
            logger.error('Database query error', { 
                cacheKey, 
                error: error.message,
                stack: error.stack 
            });
            throw this.handleDatabaseError(error);
        }
    }

    /**
     * Clean expired cache entries
     */
    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.queryCache.entries()) {
            if (now - value.timestamp > this.cacheTimeout) {
                this.queryCache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.queryCache.clear();
    }

    /**
     * Handle database errors with proper categorization
     * @param {Error} error - Database error
     * @returns {Error} Processed error
     */
    handleDatabaseError(error) {
        // Log the original error for debugging
        logger.error('Database error details', {
            name: error.name,
            message: error.message,
            sql: error.sql,
            original: error.original
        });

        // Categorize and return user-friendly errors
        switch (error.name) {
            case 'SequelizeValidationError':
                return new Error('Validation failed: ' + error.errors.map(e => e.message).join(', '));
            
            case 'SequelizeUniqueConstraintError':
                const field = error.errors[0]?.path || 'field';
                return new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists`);
            
            case 'SequelizeForeignKeyConstraintError':
                return new Error('Invalid reference to related data');
            
            case 'SequelizeConnectionError':
                return new Error('Database connection failed');
            
            case 'SequelizeTimeoutError':
                return new Error('Database query timeout');
            
            default:
                // Don't expose internal errors to users
                return new Error('Database operation failed');
        }
    }

    /**
     * Optimized user queries
     */
    async findUserByEmailOrUsername(identifier) {
        return this.cachedQuery(
            `user:${identifier}`,
            async () => {
                const { User } = this.sequelize.models;
                return User.findOne({
                    where: {
                        [Op.or]: [
                            { email: identifier.toLowerCase() },
                            { username: identifier }
                        ]
                    },
                    attributes: { exclude: ['password'] }
                });
            },
            2 * 60 * 1000 // 2 minutes cache
        );
    }

    async findUserById(id, includePassword = false) {
        return this.cachedQuery(
            `user:id:${id}:${includePassword}`,
            async () => {
                const { User } = this.sequelize.models;
                const attributes = includePassword ? {} : { exclude: ['password'] };
                return User.findByPk(id, { attributes });
            },
            5 * 60 * 1000 // 5 minutes cache
        );
    }

    /**
     * Optimized file queries
     */
    async findUserFiles(userId, options = {}) {
        const { status, mimeType, limit = 20, offset = 0 } = options;
        const cacheKey = `files:${userId}:${JSON.stringify(options)}`;
        
        return this.cachedQuery(cacheKey, async () => {
            const { FileVector } = this.sequelize.models;
            const whereClause = { user_id: userId };
            
            if (status) whereClause.processing_status = status;
            if (mimeType) whereClause.mime_type = mimeType;

            return FileVector.findAndCountAll({
                where: whereClause,
                order: [['createdAt', 'DESC']],
                limit,
                offset,
                attributes: { exclude: ['content_text', 'embedding_vector'] } // Exclude large fields
            });
        });
    }

    async findFileById(id, userId) {
        return this.cachedQuery(
            `file:${id}:${userId}`,
            async () => {
                const { FileVector } = this.sequelize.models;
                return FileVector.findOne({
                    where: { id, user_id: userId },
                    include: [{
                        model: this.sequelize.models.User,
                        as: 'user',
                        attributes: ['id', 'username', 'email']
                    }]
                });
            }
        );
    }

    /**
     * Database maintenance utilities
     */
    async getTableStats() {
        try {
            const stats = await this.sequelize.query(`
                SELECT 
                    name as table_name,
                    sql as create_sql
                FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `, { type: QueryTypes.SELECT });

            return stats;
        } catch (error) {
            logger.error('Error getting table stats', { error: error.message });
            throw error;
        }
    }

    async analyzeQuery(sql, params = []) {
        try {
            const explain = await this.sequelize.query(
                `EXPLAIN QUERY PLAN ${sql}`,
                { 
                    replacements: params,
                    type: QueryTypes.SELECT 
                }
            );
            
            logger.info('Query plan analysis', { sql, explain });
            return explain;
        } catch (error) {
            logger.error('Error analyzing query', { sql, error: error.message });
            throw error;
        }
    }

    /**
     * Batch operations for better performance
     */
    async bulkCreate(model, data, options = {}) {
        try {
            const chunkSize = options.chunkSize || 100;
            const results = [];
            
            // Process in chunks to avoid memory issues
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                const result = await model.bulkCreate(chunk, {
                    validate: true,
                    returning: true,
                    ...options
                });
                results.push(...result);
            }
            
            return results;
        } catch (error) {
            throw this.handleDatabaseError(error);
        }
    }

    async bulkUpdate(model, updates, options = {}) {
        try {
            const transaction = await this.sequelize.transaction();
            
            try {
                const results = [];
                for (const update of updates) {
                    const result = await model.update(
                        update.values,
                        { 
                            where: update.where,
                            transaction,
                            ...options
                        }
                    );
                    results.push(result);
                }
                
                await transaction.commit();
                return results;
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            throw this.handleDatabaseError(error);
        }
    }

    /**
     * Health check utilities
     */
    async healthCheck() {
        try {
            await this.sequelize.authenticate();
            
            const stats = {
                connection: 'healthy',
                cacheSize: this.queryCache.size,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            };
            
            return stats;
        } catch (error) {
            logger.error('Database health check failed', { error: error.message });
            return {
                connection: 'unhealthy',
                error: error.message
            };
        }
    }
}

module.exports = DatabaseUtils;