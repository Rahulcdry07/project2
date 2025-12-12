/**
 * ActivityLog model - Tracks user activities and security events
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ActivityLog = sequelize.define('ActivityLog', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Type of action: login, logout, password_change, profile_update, etc.'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Detailed description of the activity'
        },
        ipAddress: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'IP address from which the action was performed'
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Browser/device information'
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional metadata about the activity'
        }
    }, {
        tableName: 'activity_logs',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['action']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    return ActivityLog;
};
