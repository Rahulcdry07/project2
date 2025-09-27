#!/bin/bash

# Enhanced Test Suite Runner
# Runs comprehensive tests for all new features

echo "🚀 Starting Enhanced Test Suite..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}📋 Running: $test_name${NC}"
    echo "   Command: $test_command"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name - PASSED${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ $test_name - FAILED${NC}"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
    echo ""
}

# Start test environment
echo "🔧 Setting up test environment..."
export NODE_ENV=test

# Backend Unit Tests
echo -e "${YELLOW}📦 BACKEND UNIT TESTS${NC}"
echo "===================="

run_test "Enhanced Models Tests" "npm run test:models:enhanced"
run_test "File Controller Tests" "npm run test:controllers:file"
run_test "Enhanced Profile Tests" "npm run test:controllers:profile"
run_test "Enhanced Middleware Tests" "npm run test:middleware:enhanced"
run_test "Original Controller Tests" "npm run test:controllers"
run_test "Security Tests" "npm run test:security-unit"

# Integration Tests
echo -e "${YELLOW}🔗 INTEGRATION TESTS${NC}"
echo "==================="

run_test "API Integration Tests" "npm run test:integration"

# Frontend Tests
echo -e "${YELLOW}🎨 FRONTEND TESTS${NC}"
echo "================="

run_test "React Component Tests" "npm run test:frontend"

# End-to-End Tests
echo -e "${YELLOW}🎭 END-TO-END TESTS${NC}"
echo "==================="

run_test "Playwright E2E Tests" "npm run pw:core"

# Performance Tests
echo -e "${YELLOW}⚡ PERFORMANCE TESTS${NC}"
echo "===================="

run_test "Load Testing" "npm run test:load"

# Security Tests
echo -e "${YELLOW}🔒 SECURITY TESTS${NC}"
echo "=================="

run_test "Security Configuration" "npm run test:security-config"
run_test "Dependency Audit" "npm audit --audit-level=high"

# Linting and Code Quality
echo -e "${YELLOW}📏 CODE QUALITY${NC}"
echo "==============="

run_test "Backend Linting" "npm run lint"
run_test "Frontend Linting" "npm run lint:frontend"

# Test Summary
echo "=================================="
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo "=================================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}💥 $FAILED_TESTS TESTS FAILED${NC}"
    exit 1
fi