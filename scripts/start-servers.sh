#!/bin/bash

# Start servers for Playwright testing
# This script helps developers start both backend and frontend servers
# in the correct configuration for Playwright tests

echo "🚀 Starting servers for Playwright testing..."

# Function to check if a port is in use
port_in_use() {
    lsof -i:$1 > /dev/null 2>&1
}

# Function to start backend server
start_backend() {
    if port_in_use 3000; then
        echo "✅ Backend server already running on port 3000"
    else
        echo "🔧 Starting backend server on port 3000..."
        NODE_ENV=test node src/server.js &
        BACKEND_PID=$!
        echo "Backend server started with PID: $BACKEND_PID"
        echo $BACKEND_PID > .backend.pid
        
        # Wait for backend to be ready
        echo "⏳ Waiting for backend server to be ready..."
        npx wait-on http://localhost:3000/api/health --timeout 30000
        echo "✅ Backend server is ready!"
    fi
}

# Function to start frontend server
start_frontend() {
    if port_in_use 3001; then
        echo "✅ Frontend server already running on port 3001"
    else
        echo "🔧 Starting frontend server on port 3001..."
        cd public/dashboard-app
        npm start &
        FRONTEND_PID=$!
        echo "Frontend server started with PID: $FRONTEND_PID"
        echo $FRONTEND_PID > ../../.frontend.pid
        cd ../..
        
        # Wait for frontend to be ready
        echo "⏳ Waiting for frontend server to be ready..."
        npx wait-on http://localhost:3001 --timeout 60000
        echo "✅ Frontend server is ready!"
    fi
}

# Start servers
start_backend
start_frontend

echo ""
echo "🎉 All servers are ready for Playwright testing!"
echo ""
echo "📋 Server Status:"
echo "   • Backend:  http://localhost:3000"
echo "   • Frontend: http://localhost:3001"
echo ""
echo "🧪 Run Playwright tests with:"
echo "   npm run playwright:test"
echo "   npm run pw:core"
echo "   npm run pw:smoke"
echo ""
echo "🛑 To stop servers later:"
echo "   npm run stop:servers"