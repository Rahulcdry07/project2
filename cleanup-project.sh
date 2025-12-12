#!/bin/bash

# Cleanup script for project2

echo "Starting project cleanup..."

# Remove .DS_Store files
echo "Removing .DS_Store files..."
find . -name ".DS_Store" -type f -delete

# Remove log files
echo "Removing log files..."
find . -name "*.log" -type f -delete

# Clean tmp directory
echo "Cleaning temporary files..."
rm -rf tmp/sessions/*

# Remove build directories
echo "Removing build directories..."
rm -rf public/dashboard-app/build

# Remove SQLite database files (they should be generated, not committed)
echo "Removing database files..."
rm -f src/database.sqlite
rm -f src/test-database.sqlite
rm -f public/dashboard-app/src/database.sqlite

# Remove PHPUnit cache (shouldn't be needed for Node.js)
echo "Removing PHPUnit cache..."
rm -rf .phpunit.cache

# Remove any backup files
echo "Removing backup files..."
find . -name "*~" -o -name "*.bak" -o -name "*.swp" -type f -delete

echo "Cleanup complete!"