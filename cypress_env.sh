#!/bin/bash
# Set the environment variables for testing
export NODE_ENV=test
export CYPRESS_TESTING=true

# Restart the server with the new environment variables
echo "Restarting server with test environment settings..."
pkill -f "node.*server.js" || true
cd /workspaces/project2
node src/server.js > server.log 2>&1 &
sleep 3
echo "Server restarted with relaxed rate limiting for testing"