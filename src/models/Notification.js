/**
 * Notification model - System notifications for users
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'info',
            validate: {
                isIn: {
                    args: [['info', 'success', 'warning', 'error', 'security']],
                    msg: 'Type must be: info, success, warning, error, or security'
                }
            },
            comment: 'Type of notification'
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Notification title'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Notification message'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether the notification has been read'
        },
        readAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'When the notification was read'
        },
        link: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Optional link to related resource'
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional metadata'
        }
    }, {
        tableName: 'notifications',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['isRead']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    return Notification;
};
