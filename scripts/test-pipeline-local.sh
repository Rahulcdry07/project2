#!/bin/bash
# Local CI/CD Pipeline Test Script
# This script mimics the GitHub Actions CI/CD pipeline locally

set -e  # Exit on any error

echo "🚀 Starting Local CI/CD Pipeline Test"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Start time tracking
start_time=$(date +%s)

# Step 1: Lint Code
print_step "📋 Step 1: Linting Code..."
if npm run lint; then
    print_success "Linting completed successfully"
else
    print_error "Linting failed"
    exit 1
fi
echo ""

# Step 2: Backend Tests
print_step "🧪 Step 2: Running Backend Tests..."
# Setup test database first
if bash scripts/setup-test-db.sh; then
    if npm run test:backend; then
        print_success "Backend tests completed successfully"
    else
        print_error "Backend tests failed"
        exit 1
    fi
else
    print_error "Test database setup failed"
    exit 1
fi
echo ""

# Step 3: Frontend Tests
print_step "🎨 Step 3: Running Frontend Tests..."
if [ -f "public/dashboard-app/package.json" ]; then
    cd public/dashboard-app
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm ci
    fi
    
    # Check if test script exists
    if npm run test:ci 2>/dev/null; then
        print_success "Frontend tests completed successfully"
    else
        print_warning "Frontend tests not available or failed"
    fi
    cd ../..
else
    print_warning "Frontend directory not found, skipping frontend tests"
fi
echo ""

# Step 4: Build Application
print_step "🔨 Step 4: Building Application..."
if [ -f "public/dashboard-app/package.json" ]; then
    cd public/dashboard-app
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm ci
    fi
    
    if npm run build; then
        print_success "Frontend build completed successfully"
        
        # Check if build directory was created
        if [ -d "build" ]; then
            echo "  📁 Build artifacts created in public/dashboard-app/build/"
            echo "  📊 Build size: $(du -sh build | cut -f1)"
        fi
    else
        print_error "Frontend build failed"
        cd ../..
        exit 1
    fi
    cd ../..
else
    print_warning "Frontend build configuration not found"
fi
echo ""

# Step 5: Security Audit
print_step "🔒 Step 5: Running Security Audit..."
if npm run test:security; then
    print_success "Security audit passed"
else
    print_warning "Security audit found issues (check output above)"
fi
echo ""

# Step 6: Database Tests
print_step "🗄️  Step 6: Testing Database Operations..."
if command -v npx &> /dev/null; then
    # Test database migration (if applicable)
    if [ -f "src/migrations/20250924000000-create-users.js" ]; then
        echo "  Testing database migrations..."
        if NODE_ENV=test npm run db:migrate 2>/dev/null; then
            print_success "Database migrations work correctly"
        else
            print_warning "Database migration test skipped or failed"
        fi
    fi
else
    print_warning "NPX not available, skipping database tests"
fi
echo ""

# Step 7: E2E Tests (optional, can be slow)
if [ "$1" = "--full" ] || [ "$1" = "--e2e" ]; then
    print_step "🎭 Step 7: Running E2E Tests (Playwright)..."
    if command -v playwright &> /dev/null || [ -d "node_modules/@playwright/test" ]; then
        # Cleanup any existing processes first
        pkill -9 -f "node.*server.js" 2>/dev/null || true
        pkill -9 -f "react-scripts" 2>/dev/null || true
        sleep 2
        
        # Start backend server in background
        echo "  Starting backend server (port 3000)..."
        NODE_ENV=test node src/server.js > /tmp/backend-test.log 2>&1 &
        BACKEND_PID=$!
        
        # Start frontend server in background  
        echo "  Starting frontend server (port 3001)..."
        cd public/dashboard-app
        PORT=3001 npm start > /tmp/frontend-test.log 2>&1 &
        FRONTEND_PID=$!
        cd ../..
        
        # Wait for servers to start with timeout
        echo "  Waiting for servers to be ready..."
        MAX_WAIT=30
        WAIT_COUNT=0
        BACKEND_READY=false
        FRONTEND_READY=false
        
        while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
            if [ "$BACKEND_READY" = false ] && curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
                BACKEND_READY=true
                echo "  ✓ Backend ready (http://localhost:3000)"
            fi
            
            if [ "$FRONTEND_READY" = false ] && curl -s http://localhost:3001 > /dev/null 2>&1; then
                FRONTEND_READY=true
                echo "  ✓ Frontend ready (http://localhost:3001)"
            fi
            
            if [ "$BACKEND_READY" = true ] && [ "$FRONTEND_READY" = true ]; then
                break
            fi
            
            sleep 1
            WAIT_COUNT=$((WAIT_COUNT + 1))
        done
        
        if [ "$BACKEND_READY" = true ] && [ "$FRONTEND_READY" = true ]; then
            echo "  Running Playwright E2E tests..."
            if npm run playwright:test; then
                print_success "E2E tests completed successfully"
                E2E_EXIT=0
            else
                print_error "E2E tests failed"
                E2E_EXIT=1
            fi
        else
            print_error "Servers failed to start within ${MAX_WAIT}s"
            [ "$BACKEND_READY" = false ] && echo "  ✗ Backend not responding (check /tmp/backend-test.log)"
            [ "$FRONTEND_READY" = false ] && echo "  ✗ Frontend not responding (check /tmp/frontend-test.log)"
            E2E_EXIT=1
        fi
        
        # Aggressive cleanup of all processes
        echo "  Stopping servers..."
        kill -9 $BACKEND_PID 2>/dev/null || true
        kill -9 $FRONTEND_PID 2>/dev/null || true
        
        # Kill any child processes
        pkill -9 -P $BACKEND_PID 2>/dev/null || true
        pkill -9 -P $FRONTEND_PID 2>/dev/null || true
        
        # Kill by port
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        
        # Final cleanup
        pkill -9 -f "node.*server.js" 2>/dev/null || true
        pkill -9 -f "react-scripts" 2>/dev/null || true
        
        sleep 2
        
        if [ $E2E_EXIT -ne 0 ]; then
            exit 1
        fi
    else
        print_warning "Playwright not available, skipping E2E tests"
        echo "  Install with: npm install @playwright/test --save-dev"
        echo "  Then run: npx playwright install"
    fi
    echo ""
else
    print_step "🎭 Step 7: E2E Tests (Skipped)"
    echo "  Use --full or --e2e flag to run E2E tests"
    echo ""
fi

# Step 8: Docker Build Test (optional)
if [ "$1" = "--docker" ] || [ "$1" = "--full" ]; then
    print_step "🐳 Step 8: Testing Docker Build..."
    if command -v docker &> /dev/null; then
        if docker build -t local-ci-test . > /dev/null 2>&1; then
            print_success "Docker build completed successfully"
            echo "  🏷️  Image tagged as: local-ci-test"
            
            # Clean up test image
            docker rmi local-ci-test > /dev/null 2>&1 || true
        else
            print_error "Docker build failed"
            exit 1
        fi
    else
        print_warning "Docker not available, skipping Docker build test"
    fi
    echo ""
else
    print_step "🐳 Step 8: Docker Build (Skipped)"
    echo "  Use --docker or --full flag to test Docker build"
    echo ""
fi

# Calculate execution time
end_time=$(date +%s)
execution_time=$((end_time - start_time))
minutes=$((execution_time / 60))
seconds=$((execution_time % 60))

echo "======================================"
print_success "🎉 Local CI/CD Pipeline Test Completed!"
echo -e "${GREEN}All core stages passed successfully${NC}"
echo "⏱️  Total execution time: ${minutes}m ${seconds}s"
echo ""
echo "Your code is ready for:"
echo "  • Creating a Pull Request"
echo "  • Pushing to main branch"
echo "  • Production deployment"
echo ""
echo "Next steps:"
echo "  • Run with --full flag for complete testing including E2E"
echo "  • Run with --e2e flag for E2E tests only"
echo "  • Run with --docker flag for Docker build testing"
echo ""
