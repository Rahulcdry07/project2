#!/bin/bash

# Stop servers for Playwright testing
# This script helps developers stop both backend and frontend servers

echo "🛑 Stopping servers..."

# Function to stop server by PID file
stop_server() {
    local pid_file=$1
    local server_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔧 Stopping $server_name (PID: $pid)..."
            kill "$pid"
            rm "$pid_file"
            echo "✅ $server_name stopped"
        else
            echo "⚠️  $server_name was not running (stale PID file)"
            rm "$pid_file"
        fi
    else
        echo "ℹ️  No PID file found for $server_name"
    fi
}

# Stop backend server
stop_server ".backend.pid" "Backend server"

# Stop frontend server  
stop_server ".frontend.pid" "Frontend server"

# Also kill any node processes that might be running servers
echo "🔧 Checking for any remaining server processes..."
pkill -f "node.*server.js" 2>/dev/null && echo "✅ Killed remaining backend processes"
pkill -f "react-scripts start" 2>/dev/null && echo "✅ Killed remaining frontend processes"

echo ""
echo "✅ All servers stopped!"