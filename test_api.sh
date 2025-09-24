#!/bin/bash

# API Testing Script
BASE_URL="http://localhost:3002/api"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make API calls
function call_api {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=""
    
    if [ ! -z "$TOKEN" ]; then
        auth_header="-H \"Authorization: Bearer $TOKEN\""
    fi
    
    echo -e "${BLUE}Making $method request to $endpoint${NC}"
    
    if [ "$method" == "GET" ]; then
        cmd="curl -s -X $method $auth_header \"$BASE_URL$endpoint\""
    else
        cmd="curl -s -X $method $auth_header -H \"Content-Type: application/json\" -d '$data' \"$BASE_URL$endpoint\""
    fi
    
    # Execute the command
    echo -e "${BLUE}Command: $cmd${NC}"
    result=$(eval $cmd)
    
    # Check if result is valid JSON
    if echo "$result" | jq . &> /dev/null; then
        echo -e "${GREEN}Response:${NC}"
        echo "$result" | jq .
    else
        echo -e "${RED}Response (not JSON):${NC}"
        echo "$result"
    fi
    echo "----------------------------------------"
}

# Health check
echo -e "${BLUE}Testing Health Endpoint${NC}"
call_api "GET" "/health" ""

# Login with admin
echo -e "${BLUE}Login as admin${NC}"
login_data='{
    "email": "admin@example.com",
    "password": "admin123"
}'
login_response=$(curl -s -X POST -H "Content-Type: application/json" -d "$login_data" "$BASE_URL/auth/login")
TOKEN=$(echo $login_response | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}Login failed. Could not get token.${NC}"
    echo "Response: $login_response"
    exit 1
fi

echo -e "${GREEN}Successfully logged in. Token: ${TOKEN:0:15}...${NC}"

# Get user profile
echo -e "${BLUE}Fetching User Profile${NC}"
call_api "GET" "/profile" ""

# Get all users (admin only)
echo -e "${BLUE}Fetching All Users (Admin)${NC}"
call_api "GET" "/admin/users" ""

# Test metrics endpoint
echo -e "${BLUE}Testing Metrics Endpoint${NC}"
metrics_response=$(curl -s "http://localhost:3002/api/metrics" | head -20)
echo -e "${GREEN}First 20 lines of metrics:${NC}"
echo "$metrics_response"
echo "----------------------------------------"

# Logout
echo -e "${BLUE}Test Complete!${NC}"