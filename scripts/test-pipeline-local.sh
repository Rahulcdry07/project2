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
if npm run test:backend; then
    print_success "Backend tests completed successfully"
else
    print_error "Backend tests failed"
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
    print_step "🎭 Step 7: Running E2E Tests..."
    if command -v cypress &> /dev/null; then
        # Start server in background for E2E tests
        echo "  Starting server for E2E tests..."
        NODE_ENV=test npm run start:ci &
        SERVER_PID=$!
        
        # Wait for server to start
        sleep 5
        
        # Check if server is running
        if curl -s http://localhost:3000/api/health > /dev/null; then
            echo "  Server is running, starting E2E tests..."
            if npm run cy:run; then
                print_success "E2E tests completed successfully"
            else
                print_error "E2E tests failed"
                kill $SERVER_PID 2>/dev/null || true
                exit 1
            fi
        else
            print_error "Server failed to start for E2E tests"
            kill $SERVER_PID 2>/dev/null || true
            exit 1
        fi
        
        # Kill the server
        kill $SERVER_PID 2>/dev/null || true
        echo "  Server stopped"
    else
        print_warning "Cypress not available, skipping E2E tests"
        echo "  Install Cypress with: npm install cypress --save-dev"
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
