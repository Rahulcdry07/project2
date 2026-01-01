#!/bin/bash
# Setup Test Database Script
# Ensures test database is in a clean state before running tests

set -e

echo "🔧 Setting up test database..."

# Drop and recreate all tables
echo "  Dropping existing tables..."
psql -U project2_user -d project2_test -q << 'EOF' 2>/dev/null || true
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS "ApplicationDocuments" CASCADE;
DROP TABLE IF EXISTS "TenderApplications" CASCADE;
DROP TABLE IF EXISTS "TenderDocuments" CASCADE;
DROP TABLE IF EXISTS "Tenders" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "SequelizeMeta" CASCADE;
EOF

# Run migrations
echo "  Running migrations..."
NODE_ENV=test npx sequelize-cli db:migrate > /dev/null 2>&1

# Sync additional models
echo "  Syncing additional models..."
NODE_ENV=test node scripts/sync-test-db.js > /dev/null 2>&1

echo "✅ Test database setup complete"
