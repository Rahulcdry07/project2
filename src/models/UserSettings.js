/**
 * UserSettings model - User preferences and settings
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserSettings = sequelize.define('UserSettings', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        theme: {
            type: DataTypes.STRING,
            defaultValue: 'light',
            validate: {
                isIn: {
                    args: [['light', 'dark', 'auto']],
                    msg: 'Theme must be: light, dark, or auto'
                }
            }
        },
        language: {
            type: DataTypes.STRING,
            defaultValue: 'en',
            comment: 'User preferred language'
        },
        timezone: {
            type: DataTypes.STRING,
            defaultValue: 'UTC',
            comment: 'User timezone'
        },
        emailNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Receive email notifications'
        },
        securityAlerts: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Receive security alerts'
        },
        marketingEmails: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Receive marketing emails'
        },
        twoFactorEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Two-factor authentication enabled'
        },
        preferences: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Additional user preferences'
        }
    }, {
        tableName: 'user_settings',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            }
        ]
    });

    return UserSettings;
};
