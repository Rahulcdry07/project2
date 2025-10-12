'use strict';

/** 
 * Migration: Create Tender Management Tables
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Tenders table
    await queryInterface.createTable('Tenders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      reference_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      organization: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM(
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
        type: Sequelize.STRING,
        allowNull: false
      },
      estimated_value: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      submission_deadline: {
        type: Sequelize.DATE,
        allowNull: false
      },
      published_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      status: {
        type: Sequelize.ENUM('Active', 'Closed', 'Cancelled', 'Draft'),
        allowNull: false,
        defaultValue: 'Active'
      },
      contact_person: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      requirements: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      documents_required: {
        type: Sequelize.JSON,
        allowNull: true
      },
      eligibility_criteria: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      evaluation_criteria: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      view_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create TenderApplications table
    await queryInterface.createTable('TenderApplications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tenders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      applicant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      company_registration: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_person: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contact_phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      proposal_summary: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      quoted_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      delivery_timeline: {
        type: Sequelize.STRING,
        allowNull: true
      },
      experience_years: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      previous_projects: {
        type: Sequelize.JSON,
        allowNull: true
      },
      certifications: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('Submitted', 'Under Review', 'Shortlisted', 'Rejected', 'Awarded'),
        allowNull: false,
        defaultValue: 'Submitted'
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reviewer_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create TenderDocuments table
    await queryInterface.createTable('TenderDocuments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tenders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      file_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM(
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
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      download_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create ApplicationDocuments table
    await queryInterface.createTable('ApplicationDocuments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      application_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TenderApplications',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      file_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM(
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
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('Tenders', ['category']);
    await queryInterface.addIndex('Tenders', ['location']);
    await queryInterface.addIndex('Tenders', ['status']);
    await queryInterface.addIndex('Tenders', ['submission_deadline']);
    await queryInterface.addIndex('Tenders', ['published_date']);
    await queryInterface.addIndex('TenderApplications', ['tender_id']);
    await queryInterface.addIndex('TenderApplications', ['applicant_id']);
    await queryInterface.addIndex('TenderApplications', ['status']);
    await queryInterface.addIndex('TenderApplications', ['tender_id', 'applicant_id'], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ApplicationDocuments');
    await queryInterface.dropTable('TenderDocuments');
    await queryInterface.dropTable('TenderApplications');
    await queryInterface.dropTable('Tenders');
  }
};