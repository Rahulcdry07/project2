#!/bin/bash

echo "Cleaning up unnecessary scripts..."

# Remove redundant scripts
echo "Removing apply_fixes.sh (fixes already applied)"
rm -f apply_fixes.sh

echo "Removing cleanup.sh (replaced by cleanup-project.sh)"
rm -f cleanup.sh

# Both cypress_env.sh and update_cypress_urls.sh are used by run_cypress_tests.sh, so keep them

# Check for any temporary or backup script files
echo "Checking for temporary script files..."
temp_files=$(find . -name "*.sh.bak" -o -name "*.sh.tmp" -o -name "*.sh.old" | grep -v "node_modules")

if [ -n "$temp_files" ]; then
    echo "Removing temporary script files:"
    echo "$temp_files"
    find . -name "*.sh.bak" -o -name "*.sh.tmp" -o -name "*.sh.old" | grep -v "node_modules" | xargs rm -f
else
    echo "No temporary script files found."
fi

# Look for any other unnecessary script files
echo "Checking for other unnecessary script files..."
find . -name "*.js.new" -o -name "*.js.optimized" | grep -v "node_modules" | xargs rm -f 2>/dev/null

# Remove any stray session files
echo "Cleaning session files..."
rm -rf tmp/sessions/* 2>/dev/null

echo "Script cleanup complete!"