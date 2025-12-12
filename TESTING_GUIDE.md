# GitHub Actions Testing Helpers

## Quick CI/CD Pipeline Tests

### 1. Test Core Pipeline (Fast)
```bash
./test-pipeline-local.sh
```
This runs: Lint → Backend Tests → Frontend Tests → Build → Security Audit

### 2. Test Full Pipeline (Comprehensive)
```bash
./test-pipeline-local.sh --full
```
This runs everything including E2E tests and Docker build

### 3. Test E2E Only
```bash
./test-pipeline-local.sh --e2e
```
This runs only the E2E tests with server startup

### 4. Test Docker Build
```bash
./test-pipeline-local.sh --docker
```
This runs core tests plus Docker build verification

## Testing Individual Components

### Backend Tests
```bash
npm run test:backend
```

### Frontend Tests (if available)
```bash
cd public/dashboard-app && npm test
```

### Cypress E2E Tests
```bash
# Open Cypress GUI
npm run cy:open

# Run headless tests
npm run cy:run

# Run specific test
npm run cy:run:routing
```

### Linting
```bash
# Backend linting
npm run lint
npm run lint:fix

# Frontend linting (if available)
npm run lint:frontend
npm run lint:frontend:fix
```

### Security Testing
```bash
npm run test:security
npm audit --audit-level=high
npm run audit:fix
```

### Build Testing
```bash
# Frontend build
cd public/dashboard-app
npm run build

# Docker build
npm run docker:build
npm run docker:run
```

## GitHub Actions Simulation

### Using Act (GitHub Actions Local Runner)
```bash
# Install Act
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run full workflow
act -W .github/workflows/ci-cd.yml

# Run specific jobs
act -j lint
act -j test-backend
act -j test-frontend
act -j e2e-tests
act -j build
```

### Manual Workflow Dispatch
1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select your workflow
4. Click "Run workflow" button
5. Choose branch and parameters

## Testing on GitHub

### Method 1: Feature Branch + PR
```bash
# Create test branch
git checkout -b test-ci-pipeline-$(date +%s)

# Make a small change to trigger CI
echo "# CI Test $(date)" >> CI_TEST.md
git add CI_TEST.md
git commit -m "test: trigger CI/CD pipeline"

# Push and create PR
git push origin test-ci-pipeline-$(date +%s)
```

### Method 2: Draft Pull Request
Create a draft PR to test without notifying reviewers:
1. Push your branch
2. Create PR as "Draft"
3. Monitor Actions tab for results
4. Convert to regular PR when ready

## Monitoring and Debugging

### Check GitHub Actions Status
- Visit: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
- Look for workflow runs and their status
- Click on failed runs to see detailed logs

### Download Artifacts
GitHub Actions can save build artifacts and test results:
```yaml
- name: Archive test results
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: test-results
    path: |
      test-results/
      cypress/screenshots/
      cypress/videos/
```

### Local Debugging
```bash
# Run with debug output
DEBUG=* npm run test:backend

# Run specific test files
npx mocha test/specific-test.js --timeout 10000

# Check server logs
tail -f server.log
```

## Common Issues and Solutions

### Port Conflicts
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Use different port for testing
PORT=3001 npm start
```

### Database Issues
```bash
# Reset test database
npm run db:migrate:undo:all
npm run db:migrate
npm run db:seed
```

### Node Version Consistency
```bash
# Check Node version
node --version

# Use same version as CI
nvm install 20
nvm use 20
```

### Cache Issues
```bash
# Clear npm cache
npm cache clean --force

# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimization

### Parallel Testing
Your current CI runs backend and frontend tests in parallel after linting, which is efficient.

### Caching
GitHub Actions caches `node_modules` based on `package-lock.json` changes.

### Conditional Steps
Some steps only run on specific branches or conditions:
```yaml
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

## Best Practices Checklist

- [ ] Tests run locally before pushing
- [ ] All tests pass independently
- [ ] No hardcoded secrets or credentials
- [ ] Environment variables properly configured
- [ ] Database migrations tested
- [ ] Build artifacts verified
- [ ] Security scans passing
- [ ] E2E tests covering critical paths
- [ ] Docker build working (if using containers)
- [ ] Deployment process tested

## Quick Commands Summary
```bash
# Fast local test
./test-pipeline-local.sh

# Full comprehensive test
./test-pipeline-local.sh --full

# Individual components
npm run lint && npm run test:backend

# E2E testing
npm run cy:run

# Security check
npm run test:security

# Build verification
cd public/dashboard-app && npm run build
```