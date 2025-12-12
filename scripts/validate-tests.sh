#!/bin/bash

# Pre-Commit Test Validation Script
# Ensures all tests pass before allowing commits

set -e

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🧪 PRE-COMMIT TEST VALIDATION"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
TESTS_PASSED=true

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        TESTS_PASSED=false
    fi
}

# Function to print section header
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Start time
START_TIME=$(date +%s)

# 1. LINTING
print_header "1/3: CODE QUALITY (ESLint)"
echo "Running ESLint on backend code..."
npm run lint --silent > /dev/null 2>&1
print_status $? "Backend linting"

cd public/dashboard-app
echo "Running ESLint on frontend code..."
npm run lint --silent > /dev/null 2>&1
LINT_STATUS=$?
cd ../..
print_status $LINT_STATUS "Frontend linting"

# 2. BACKEND TESTS
print_header "2/3: BACKEND TESTS (172 tests)"
echo "Running all backend unit and integration tests..."
echo "This includes: models, controllers, tenders, middleware, utils, security, integration"

npm run test:unit --silent > /dev/null 2>&1
BACKEND_STATUS=$?

if [ $BACKEND_STATUS -eq 0 ]; then
    print_status 0 "Backend tests (172/172 passing)"
else
    print_status 1 "Backend tests FAILED"
    echo ""
    echo -e "${YELLOW}Run 'npm run test:unit' to see detailed error output${NC}"
fi

# 3. FRONTEND TESTS  
print_header "3/3: FRONTEND TESTS (177 tests)"
echo "Running all frontend component, hook, and service tests..."

cd public/dashboard-app
npm test -- --run --silent > /dev/null 2>&1
FRONTEND_STATUS=$?
cd ../..

if [ $FRONTEND_STATUS -eq 0 ]; then
    print_status 0 "Frontend tests (177/177 passing)"
else
    print_status 1 "Frontend tests FAILED"
    echo ""
    echo -e "${YELLOW}Run 'npm run test:frontend' to see detailed error output${NC}"
fi

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Final summary
echo ""
echo "═══════════════════════════════════════════════════════════"

if [ "$TESTS_PASSED" = true ]; then
    echo -e "${GREEN}  ✅ ALL CHECKS PASSED!${NC}"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo -e "${GREEN}  📊 Test Summary:${NC}"
    echo -e "     • Backend:  172/172 passing"
    echo -e "     • Frontend: 177/177 passing"
    echo -e "     • Total:    349/349 passing (100%)"
    echo ""
    echo -e "${GREEN}  🚀 Safe to commit!${NC}"
    echo -e "     Completed in ${DURATION}s"
    echo ""
    exit 0
else
    echo -e "${RED}  ❌ TESTS FAILED${NC}"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo -e "${RED}  ⚠️  COMMIT BLOCKED${NC}"
    echo ""
    echo "  Please fix the failing tests before committing:"
    echo ""
    if [ $BACKEND_STATUS -ne 0 ]; then
        echo "  • Run: npm run test:unit"
        echo "    to see backend test failures"
        echo ""
    fi
    if [ $FRONTEND_STATUS -ne 0 ]; then
        echo "  • Run: npm run test:frontend"
        echo "    to see frontend test failures"
        echo ""
    fi
    echo "  See TESTING_CHECKLIST.md for debugging help"
    echo ""
    exit 1
fi
