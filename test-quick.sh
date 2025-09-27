#!/bin/bash

# Quick Test Runner for New Features
# Runs only the new feature tests for faster feedback

echo "⚡ Quick Test Runner - New Features Only"
echo "======================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

export NODE_ENV=test

echo -e "${BLUE}🧪 Testing New Backend Features...${NC}"

# Test new controllers and middleware
echo "📁 File Management Tests..."
npm run test:controllers:file

echo "👤 Enhanced Profile Tests..."
npm run test:controllers:profile

echo "🛡️  Enhanced Middleware Tests..."
npm run test:middleware:enhanced

echo "📊 Enhanced Models Tests..."
npm run test:models:enhanced

echo -e "${BLUE}🎨 Testing Frontend Components...${NC}"
npm run test:frontend

echo -e "${GREEN}✅ Quick tests completed!${NC}"

echo ""
echo "💡 To run full test suite: ./test-enhanced-features.sh"
echo "💡 To run integration tests: npm run test:integration"
echo "💡 To run E2E tests: npm run pw:core"