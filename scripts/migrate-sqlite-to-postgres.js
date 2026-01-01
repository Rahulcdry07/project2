/**
 * Script to migrate data from SQLite to PostgreSQL
 * Run: node scripts/migrate-sqlite-to-postgres.js
 */

const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

// SQLite connection
const sqliteSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './src/database.sqlite',
  logging: false,
});

// PostgreSQL connection
const postgresSequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project2_dev',
  username: process.env.DB_USER || 'project2_user',
  password: process.env.DB_PASSWORD || 'project2_password',
  logging: false,
});

async function migrateData() {
  try {
    console.log('🔄 Starting data migration from SQLite to PostgreSQL...\n');

    // Test connections
    await sqliteSequelize.authenticate();
    console.log('✅ SQLite connection established');

    await postgresSequelize.authenticate();
    console.log('✅ PostgreSQL connection established\n');

    // Migrate Users
    console.log('📦 Migrating Users...');
    const [sqliteUsers] = await sqliteSequelize.query('SELECT * FROM Users');

    if (sqliteUsers.length > 0) {
      for (const user of sqliteUsers) {
        await postgresSequelize.query(
          `INSERT INTO "Users" (id, username, email, password, role, is_verified, verification_token, reset_token, reset_token_expires_at, "createdAt", "updatedAt")
           VALUES (:id, :username, :email, :password, :role, :is_verified, :verification_token, :reset_token, :reset_token_expires_at, :createdAt, :updatedAt)
           ON CONFLICT (id) DO NOTHING`,
          {
            replacements: {
              id: user.id,
              username: user.username,
              email: user.email,
              password: user.password,
              role: user.role,
              is_verified: Boolean(user.is_verified), // Convert integer to boolean
              verification_token: user.verification_token,
              reset_token: user.reset_token,
              reset_token_expires_at: user.reset_token_expires_at,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
          }
        );
      }

      // Reset the sequence
      await postgresSequelize.query(
        `SELECT setval('"Users_id_seq"', (SELECT MAX(id) FROM "Users"))`
      );

      console.log(`✅ Migrated ${sqliteUsers.length} users\n`);
    } else {
      console.log('ℹ️  No users to migrate\n');
    }

    // Migrate Tenders
    console.log('📦 Migrating Tenders...');
    const [sqliteTenders] = await sqliteSequelize.query('SELECT * FROM Tenders');

    if (sqliteTenders.length > 0) {
      for (const tender of sqliteTenders) {
        await postgresSequelize.query(
          `INSERT INTO "Tenders" (
            id, title, description, reference_number, organization, category, location,
            estimated_value, currency, submission_deadline, published_date, status,
            contact_person, contact_email, contact_phone, requirements, documents_required,
            eligibility_criteria, evaluation_criteria, tags, is_featured, view_count,
            created_by, "createdAt", "updatedAt"
          )
          VALUES (
            :id, :title, :description, :reference_number, :organization, :category, :location,
            :estimated_value, :currency, :submission_deadline, :published_date, :status,
            :contact_person, :contact_email, :contact_phone, :requirements, :documents_required,
            :eligibility_criteria, :evaluation_criteria, :tags, :is_featured, :view_count,
            :created_by, :createdAt, :updatedAt
          )
          ON CONFLICT (id) DO NOTHING`,
          {
            replacements: {
              ...tender,
              is_featured: Boolean(tender.is_featured), // Convert integer to boolean
              documents_required: tender.documents_required
                ? JSON.stringify(tender.documents_required)
                : null,
              tags: tender.tags ? JSON.stringify(tender.tags) : null,
            },
          }
        );
      }

      // Reset the sequence
      await postgresSequelize.query(
        `SELECT setval('"Tenders_id_seq"', (SELECT MAX(id) FROM "Tenders"))`
      );

      console.log(`✅ Migrated ${sqliteTenders.length} tenders\n`);
    } else {
      console.log('ℹ️  No tenders to migrate\n');
    }

    // Migrate Tender Applications
    console.log('📦 Migrating Tender Applications...');
    const [sqliteApplications] = await sqliteSequelize.query('SELECT * FROM TenderApplications');

    if (sqliteApplications.length > 0) {
      for (const app of sqliteApplications) {
        await postgresSequelize.query(
          `INSERT INTO "TenderApplications" (
            id, tender_id, applicant_id, company_name, company_registration, contact_person,
            contact_email, contact_phone, proposal_summary, quoted_amount, currency,
            delivery_timeline, experience_years, previous_projects, certifications,
            status, submitted_at, reviewed_at, reviewer_notes, score, "createdAt", "updatedAt"
          )
          VALUES (
            :id, :tender_id, :applicant_id, :company_name, :company_registration, :contact_person,
            :contact_email, :contact_phone, :proposal_summary, :quoted_amount, :currency,
            :delivery_timeline, :experience_years, :previous_projects, :certifications,
            :status, :submitted_at, :reviewed_at, :reviewer_notes, :score, :createdAt, :updatedAt
          )
          ON CONFLICT (id) DO NOTHING`,
          {
            replacements: {
              ...app,
              previous_projects: app.previous_projects
                ? JSON.stringify(app.previous_projects)
                : null,
              certifications: app.certifications ? JSON.stringify(app.certifications) : null,
            },
          }
        );
      }

      // Reset the sequence
      await postgresSequelize.query(
        `SELECT setval('"TenderApplications_id_seq"', (SELECT MAX(id) FROM "TenderApplications"))`
      );

      console.log(`✅ Migrated ${sqliteApplications.length} applications\n`);
    } else {
      console.log('ℹ️  No applications to migrate\n');
    }

    // Migrate Tender Documents
    console.log('📦 Migrating Tender Documents...');
    const [sqliteTenderDocs] = await sqliteSequelize.query('SELECT * FROM TenderDocuments');

    if (sqliteTenderDocs.length > 0) {
      for (const doc of sqliteTenderDocs) {
        await postgresSequelize.query(
          `INSERT INTO "TenderDocuments" (
            id, tender_id, name, description, file_path, file_size, file_type,
            category, is_required, download_count, uploaded_by, "createdAt", "updatedAt"
          )
          VALUES (
            :id, :tender_id, :name, :description, :file_path, :file_size, :file_type,
            :category, :is_required, :download_count, :uploaded_by, :createdAt, :updatedAt
          )
          ON CONFLICT (id) DO NOTHING`,
          {
            replacements: {
              ...doc,
              is_required: Boolean(doc.is_required), // Convert integer to boolean
            },
          }
        );
      }

      // Reset the sequence
      await postgresSequelize.query(
        `SELECT setval('"TenderDocuments_id_seq"', (SELECT MAX(id) FROM "TenderDocuments"))`
      );

      console.log(`✅ Migrated ${sqliteTenderDocs.length} tender documents\n`);
    } else {
      console.log('ℹ️  No tender documents to migrate\n');
    }

    // Migrate Application Documents
    console.log('📦 Migrating Application Documents...');
    const [sqliteAppDocs] = await sqliteSequelize.query('SELECT * FROM ApplicationDocuments');

    if (sqliteAppDocs.length > 0) {
      for (const doc of sqliteAppDocs) {
        await postgresSequelize.query(
          `INSERT INTO "ApplicationDocuments" (
            id, application_id, name, description, file_path, file_size, file_type,
            category, uploaded_by, "createdAt", "updatedAt"
          )
          VALUES (
            :id, :application_id, :name, :description, :file_path, :file_size, :file_type,
            :category, :uploaded_by, :createdAt, :updatedAt
          )
          ON CONFLICT (id) DO NOTHING`,
          {
            replacements: doc,
          }
        );
      }

      // Reset the sequence
      await postgresSequelize.query(
        `SELECT setval('"ApplicationDocuments_id_seq"', (SELECT MAX(id) FROM "ApplicationDocuments"))`
      );

      console.log(`✅ Migrated ${sqliteAppDocs.length} application documents\n`);
    } else {
      console.log('ℹ️  No application documents to migrate\n');
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sqliteSequelize.close();
    await postgresSequelize.close();
  }
}

// Run migration
migrateData();
