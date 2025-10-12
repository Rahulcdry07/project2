/**
 * ApplicationDocument model definition
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ApplicationDocument = sequelize.define('ApplicationDocument', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        application_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'TenderApplications',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Document name cannot be empty'
                }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        file_path: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'File path cannot be empty'
                }
            }
        },
        file_size: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: [0],
                    msg: 'File size must be positive'
                }
            }
        },
        file_type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: {
                    args: [['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip', 'rar', 'jpg', 'png']],
                    msg: 'File type must be one of: pdf, doc, docx, xls, xlsx, txt, zip, rar, jpg, png'
                }
            }
        },
        category: {
            type: DataTypes.ENUM(
                'Company Profile',
                'Financial Documents',
                'Technical Proposal',
                'Commercial Proposal',
                'Certificates',
                'Experience Documents',
                'Registration Documents',
                'Other'
            ),
            allowNull: false,
            defaultValue: 'Other'
        },
        uploaded_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    }, {
        tableName: 'ApplicationDocuments',
        timestamps: true,
        indexes: [
            {
                fields: ['application_id']
            },
            {
                fields: ['category']
            },
            {
                fields: ['file_type']
            },
            {
                fields: ['uploaded_by']
            }
        ]
    });

    // Define associations
    ApplicationDocument.associate = (models) => {
        // Document belongs to TenderApplication
        ApplicationDocument.belongsTo(models.TenderApplication, {
            foreignKey: 'application_id',
            as: 'application'
        });

        // Document belongs to User (uploader)
        ApplicationDocument.belongsTo(models.User, {
            foreignKey: 'uploaded_by',
            as: 'uploader'
        });
    };

    return ApplicationDocument;
};