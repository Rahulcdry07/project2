/**
 * Note model - User notes and documents
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Note = sequelize.define('Note', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Title cannot be empty'
                },
                len: {
                    args: [1, 255],
                    msg: 'Title must be between 1 and 255 characters'
                }
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'Note content'
        },
        color: {
            type: DataTypes.STRING,
            defaultValue: 'default',
            comment: 'Color tag for the note'
        },
        isPinned: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: 'Whether the note is pinned to the top'
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Array of tags'
        }
    }, {
        tableName: 'notes',
        timestamps: true,
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['isPinned']
            },
            {
                fields: ['createdAt']
            }
        ]
    });

    return Note;
};
