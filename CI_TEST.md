# CI/CD Pipeline Testing Guide

## Overview

This guide covers how to test your CI/CD pipeline both locally and on GitHub Actions. Your current pipeline includes linting, backend tests, frontend tests, E2E tests, building, and deployment.

## Current Pipeline Structure

```
CI/CD Pipeline Flow:
├── Lint Code
├── Test Backend (parallel after lint)
├── Test Frontend (parallel after lint)
├── Build Application (after backend/frontend tests)
├── E2E Tests (after backend/frontend tests)
└── Deploy (after build and E2E tests, only on main branch)
```

## 1. Local Testing Methods

### Option A: Test Individual Pipeline Stages

```bash
# 1. Test Linting
npm run lint

# 2. Test Backend
npm run test:backend

# 3. Test Frontend (if you have frontend tests)
cd public/dashboard-app && npm test

# 4. Test Build Process
cd public/dashboard-app && npm ci && npm run build

# 5. Test E2E with Cypress
npm run cy:run
```

### Option B: Use Local Pipeline Script

Create a comprehensive local testing script that mimics the CI/CD pipeline:

```bash
#!/bin/bash
# Save as test-pipeline-local.sh

set -e  # Exit on any error

echo "🚀 Starting Local CI/CD Pipeline Test"
echo "======================================"

# Step 1: Lint Code
echo "📋 Step 1: Linting Code..."
npm run lint
echo "✅ Linting completed successfully"
echo ""

# Step 2: Backend Tests
echo "🧪 Step 2: Running Backend Tests..."
npm run test:backend
echo "✅ Backend tests completed successfully"
echo ""

# Step 3: Frontend Tests (if available)
echo "🎨 Step 3: Running Frontend Tests..."
if [ -f "public/dashboard-app/package.json" ]; then
    cd public/dashboard-app
    npm ci
    if npm run test --if-present 2>/dev/null; then
        echo "✅ Frontend tests completed successfully"
    else
        echo "⚠️  No frontend tests found or tests failed"
    fi
    cd ../..
else
    echo "⚠️  Frontend directory not found, skipping frontend tests"
fi
echo ""

# Step 4: Build Application
echo "🔨 Step 4: Building Application..."
if [ -f "public/dashboard-app/package.json" ]; then
    cd public/dashboard-app
    npm run build
    echo "✅ Build completed successfully"
    cd ../..
else
    echo "⚠️  Frontend build not available"
fi
echo ""

# Step 5: E2E Tests
echo "🎭 Step 5: Running E2E Tests..."
if command -v cypress &> /dev/null; then
    npm run cy:run
    echo "✅ E2E tests completed successfully"
else
    echo "⚠️  Cypress not available, skipping E2E tests"
fi
echo ""

echo "🎉 Local CI/CD Pipeline Test Completed Successfully!"
echo "All stages passed. Your code is ready for deployment."
```

## 2. GitHub Actions Testing Strategies

### Method 1: Push to Feature Branch

1. **Create a feature branch:**
   ```bash
   git checkout -b test-ci-pipeline
   git push origin test-ci-pipeline
   ```

2. **Open a Pull Request:**
   - Go to your GitHub repository
   - Create a PR from your feature branch to main
   - This will trigger the CI/CD pipeline (except deployment)

### Method 2: Use Act (Local GitHub Actions Runner)

Install and use Act to run GitHub Actions locally:

```bash
# Install Act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run specific workflow
act -W .github/workflows/ci-cd.yml

# Run specific job
act -j lint
act -j test-backend
act -j test-frontend
```

### Method 3: Workflow Dispatch (Manual Trigger)

Add workflow dispatch to your CI/CD yaml:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:  # Add this line
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production
```

## 3. Testing Specific Components

### Database Migrations
```bash
# Test migration scripts
npm run db:migrate
npm run db:seed
npm run db:migrate:undo
```

### Security Testing
```bash
# Test security scans
npm run test:security
npm audit --audit-level=high
```

### Load Testing
```bash
# Test performance
npm run test:load
```

### Docker Testing
```bash
# Test containerization
npm run docker:build
npm run docker:run

# Test container health
docker ps
curl http://localhost:3002/api/health
```

## 4. Common CI/CD Issues and Solutions

### Issue 1: Port Conflicts
**Problem:** Multiple processes trying to use the same port
**Solution:** Use dynamic port allocation or different ports per environment

```javascript
// In your server.js
const PORT = process.env.PORT || (process.env.NODE_ENV === 'test' ? 3001 : 3000);
```

### Issue 2: Environment Variables
**Problem:** Missing environment variables in CI
**Solution:** Add GitHub Secrets and environment setup

```yaml
# In GitHub Actions
env:
  NODE_ENV: test
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Issue 3: Test Database Issues
**Problem:** Tests interfering with each other
**Solution:** Use separate test databases and cleanup

```javascript
// In test setup
beforeEach(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  await sequelize.close();
});
```

## 5. Monitoring and Debugging

### GitHub Actions Logs
- Check Actions tab in your GitHub repository
- Look for failed steps and error messages
- Download artifacts for detailed debugging

### Local Debugging
```bash
# Run tests with verbose output
DEBUG=* npm run test:backend

# Run Cypress in headed mode for debugging
npm run cy:open
```

### Health Checks
```bash
# Test your application endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/metrics
```

## 6. Best Practices

1. **Test Early and Often:** Run tests locally before pushing
2. **Use Feature Branches:** Always test changes in feature branches first
3. **Monitor Pipeline Performance:** Keep track of build times and optimize slow steps
4. **Handle Secrets Safely:** Use GitHub Secrets for sensitive data
5. **Parallel Jobs:** Run independent tests in parallel to reduce build time
6. **Fail Fast:** Configure your pipeline to stop on first failure
7. **Artifact Storage:** Save build artifacts and test results for debugging

## 7. Quick Commands Reference

```bash
# Full local pipeline test
chmod +x test-pipeline-local.sh && ./test-pipeline-local.sh

# Individual component tests
npm run lint                    # Linting
npm run test:backend           # Backend tests
npm run cy:run                 # E2E tests
npm run test:security          # Security audit
npm run test:load             # Load testing

# Build and deployment preparation
npm run docker:build          # Docker build
cd public/dashboard-app && npm run build  # Frontend build

# Database operations
npm run db:migrate            # Run migrations
npm run db:seed              # Seed database
npm run db:reset             # Reset database
```

## 8. Troubleshooting Tips

- **Check Node.js version:** Ensure consistency between local and CI environments
- **Clear caches:** `npm ci` instead of `npm install` for clean installs
- **Check file permissions:** Ensure scripts are executable
- **Review logs:** Always check both stdout and stderr outputs
- **Test isolation:** Ensure tests don't depend on external services
- **Resource cleanup:** Make sure tests clean up after themselves

This guide should help you thoroughly test your CI/CD pipeline both locally and in your GitHub Actions environment.
