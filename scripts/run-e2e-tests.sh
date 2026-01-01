#!/bin/bash
# Quick E2E Test Runner
# Runs only E2E tests without full pipeline

set -e

echo "🎭 Running E2E Tests"
echo "===================="
echo ""

# Cleanup any existing processes
echo "Cleaning up old processes..."
pkill -9 -f "node.*server.js" 2>/dev/null || true
pkill -9 -f "react-scripts" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Start backend server
echo "Starting backend server (port 3000)..."
NODE_ENV=test node src/server.js > /tmp/backend-e2e.log 2>&1 &
BACKEND_PID=$!

# Start frontend server
echo "Starting frontend server (port 3001)..."
cd public/dashboard-app
PORT=3001 npm start > /tmp/frontend-e2e.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Wait for servers with timeout
echo "Waiting for servers to be ready..."
MAX_WAIT=40
WAIT_COUNT=0
BACKEND_READY=false
FRONTEND_READY=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if [ "$BACKEND_READY" = false ] && curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        BACKEND_READY=true
        echo "✓ Backend ready (http://localhost:3000)"
    fi
    
    if [ "$FRONTEND_READY" = false ] && curl -s http://localhost:3001 > /dev/null 2>&1; then
        FRONTEND_READY=true
        echo "✓ Frontend ready (http://localhost:3001)"
    fi
    
    if [ "$BACKEND_READY" = true ] && [ "$FRONTEND_READY" = true ]; then
        break
    fi
    
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    echo -n "."
done
echo ""

if [ "$BACKEND_READY" = true ] && [ "$FRONTEND_READY" = true ]; then
    echo ""
    echo "Running Playwright tests..."
    npm run playwright:test
    TEST_EXIT=$?
else
    echo "❌ Servers failed to start within ${MAX_WAIT}s"
    [ "$BACKEND_READY" = false ] && echo "  Backend not responding (check /tmp/backend-e2e.log)"
    [ "$FRONTEND_READY" = false ] && echo "  Frontend not responding (check /tmp/frontend-e2e.log)"
    TEST_EXIT=1
fi

# Cleanup
echo ""
echo "Cleaning up..."
kill -9 $BACKEND_PID 2>/dev/null || true
kill -9 $FRONTEND_PID 2>/dev/null || true
pkill -9 -P $BACKEND_PID 2>/dev/null || true
pkill -9 -P $FRONTEND_PID 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
pkill -9 -f "node.*server.js" 2>/dev/null || true
pkill -9 -f "react-scripts" 2>/dev/null || true

sleep 2
echo "Cleanup complete"

exit $TEST_EXIT
