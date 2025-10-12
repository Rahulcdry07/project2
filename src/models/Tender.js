/**
 * Tender model definition
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Tender = sequelize.define('Tender', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Title cannot be empty'
                },
                len: {
                    args: [10, 500],
                    msg: 'Title must be between 10 and 500 characters'
                }
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Description cannot be empty'
                },
                len: {
                    args: [50, 5000],
                    msg: 'Description must be between 50 and 5000 characters'
                }
            }
        },
        reference_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: 'Reference number cannot be empty'
                }
            }
        },
        organization: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Organization name cannot be empty'
                }
            }
        },
        category: {
            type: DataTypes.ENUM(
                'Construction',
                'IT Services',
                'Consulting',
                'Supplies',
                'Transportation',
                'Healthcare',
                'Education',
                'Engineering',
                'Maintenance',
                'Other'
            ),
            allowNull: false,
            defaultValue: 'Other'
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Location cannot be empty'
                }
            }
        },
        estimated_value: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            validate: {
                min: {
                    args: [0],
                    msg: 'Estimated value must be positive'
                }
            }
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'USD',
            validate: {
                len: {
                    args: [3, 3],
                    msg: 'Currency must be 3 characters (e.g., USD, EUR)'
                }
            }
        },
        submission_deadline: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: {
                    msg: 'Submission deadline must be a valid date'
                },
                isFuture(value) {
                    if (new Date(value) <= new Date()) {
                        throw new Error('Submission deadline must be in the future');
                    }
                }
            }
        },
        published_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.ENUM('Active', 'Closed', 'Cancelled', 'Draft'),
            allowNull: false,
            defaultValue: 'Active'
        },
        contact_person: {
            type: DataTypes.STRING,
            allowNull: true
        },
        contact_email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: {
                    msg: 'Contact email must be a valid email address'
                }
            }
        },
        contact_phone: {
            type: DataTypes.STRING,
            allowNull: true
        },
        requirements: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        documents_required: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        eligibility_criteria: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        evaluation_criteria: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        is_featured: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        view_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    }, {
        tableName: 'Tenders',
        timestamps: true,
        indexes: [
            {
                fields: ['category']
            },
            {
                fields: ['location']
            },
            {
                fields: ['status']
            },
            {
                fields: ['submission_deadline']
            },
            {
                fields: ['published_date']
            },
            {
                fields: ['reference_number'],
                unique: true
            }
        ]
    });

    // Define associations
    Tender.associate = (models) => {
        // Tender belongs to User (creator)
        Tender.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });

        // Tender has many applications
        Tender.hasMany(models.TenderApplication, {
            foreignKey: 'tender_id',
            as: 'applications'
        });

        // Tender has many documents
        Tender.hasMany(models.TenderDocument, {
            foreignKey: 'tender_id',
            as: 'documents'
        });
    };

    return Tender;
};