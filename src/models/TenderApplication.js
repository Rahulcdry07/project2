/**
 * TenderApplication model definition
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TenderApplication = sequelize.define('TenderApplication', {
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
        applicant_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Company name cannot be empty'
                }
            }
        },
        company_registration: {
            type: DataTypes.STRING,
            allowNull: true
        },
        contact_person: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Contact person cannot be empty'
                }
            }
        },
        contact_email: {
            type: DataTypes.STRING,
            allowNull: false,
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
        proposal_summary: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Proposal summary cannot be empty'
                },
                len: {
                    args: [100, 2000],
                    msg: 'Proposal summary must be between 100 and 2000 characters'
                }
            }
        },
        quoted_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            validate: {
                min: {
                    args: [0],
                    msg: 'Quoted amount must be positive'
                }
            }
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'USD'
        },
        delivery_timeline: {
            type: DataTypes.STRING,
            allowNull: true
        },
        experience_years: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: {
                    args: [0],
                    msg: 'Experience years must be positive'
                },
                max: {
                    args: [100],
                    msg: 'Experience years must be reasonable'
                }
            }
        },
        previous_projects: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        certifications: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        status: {
            type: DataTypes.ENUM('Submitted', 'Under Review', 'Shortlisted', 'Rejected', 'Awarded'),
            allowNull: false,
            defaultValue: 'Submitted'
        },
        submitted_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        reviewed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        reviewer_notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        score: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true,
            validate: {
                min: {
                    args: [0],
                    msg: 'Score must be between 0 and 10'
                },
                max: {
                    args: [10],
                    msg: 'Score must be between 0 and 10'
                }
            }
        }
    }, {
        tableName: 'TenderApplications',
        timestamps: true,
        indexes: [
            {
                fields: ['tender_id']
            },
            {
                fields: ['applicant_id']
            },
            {
                fields: ['status']
            },
            {
                fields: ['submitted_at']
            },
            {
                fields: ['tender_id', 'applicant_id'],
                unique: true // One application per user per tender
            }
        ]
    });

    // Define associations
    TenderApplication.associate = (models) => {
        // Application belongs to Tender
        TenderApplication.belongsTo(models.Tender, {
            foreignKey: 'tender_id',
            as: 'tender'
        });

        // Application belongs to User (applicant)
        TenderApplication.belongsTo(models.User, {
            foreignKey: 'applicant_id',
            as: 'applicant'
        });

        // Application has many documents
        TenderApplication.hasMany(models.ApplicationDocument, {
            foreignKey: 'application_id',
            as: 'documents'
        });
    };

    return TenderApplication;
};