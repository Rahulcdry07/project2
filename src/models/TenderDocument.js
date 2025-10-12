/**
 * TenderDocument model definition
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TenderDocument = sequelize.define('TenderDocument', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        tender_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Tenders',
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
                    args: [['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip', 'rar']],
                    msg: 'File type must be one of: pdf, doc, docx, xls, xlsx, txt, zip, rar'
                }
            }
        },
        category: {
            type: DataTypes.ENUM(
                'Tender Document', 
                'Specifications', 
                'Terms and Conditions', 
                'Application Form', 
                'Technical Requirements',
                'Financial Requirements',
                'Addendum',
                'Other'
            ),
            allowNull: false,
            defaultValue: 'Tender Document'
        },
        is_required: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        download_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
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
        tableName: 'TenderDocuments',
        timestamps: true,
        indexes: [
            {
                fields: ['tender_id']
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
    TenderDocument.associate = (models) => {
        // Document belongs to Tender
        TenderDocument.belongsTo(models.Tender, {
            foreignKey: 'tender_id',
            as: 'tender'
        });

        // Document belongs to User (uploader)
        TenderDocument.belongsTo(models.User, {
            foreignKey: 'uploaded_by',
            as: 'uploader'
        });
    };

    return TenderDocument;
};