# Quick Reference: Organized Project Structure

## 📁 Where to Find Things

### Configuration Files
**Location**: `/config`

- **Babel** → `config/babel/babel.config.js`
- **ESLint** → `config/eslint/.eslintrc.json` & `.eslintignore`
- **Playwright** → `config/playwright/playwright.config.js`

### Documentation
**Location**: `/docs`

- **Testing Docs** → `docs/testing/`
  - CI/CD Testing: `CI_TEST.md`
  - Testing Guide: `TESTING_GUIDE.md`
  - Migration Guide: `TESTING_MIGRATION.md`
  
- **Developer Guides** → `docs/guides/`
  - Contributing: `CONTRIBUTING.md`

### Scripts
**Location**: `/scripts`

- Server management: `start-servers.sh`, `stop-servers.sh`
- Security testing: `test-security.sh`
- Pipeline testing: `test-pipeline-local.sh`
- Dependency scanning: `dependency-scan.js`
- Type generation: `generate-types.js`
- CI validation: `validate-ci.js`

### Test Results
**Location**: `/test-results` (gitignored)

- Playwright results: `test-results/playwright/`
- HTML reports: `test-results/playwright-report/`

## 🚀 Common Commands (Unchanged)

All npm scripts work exactly as before:

```bash
# Development
npm start                    # Start backend server
cd public/dashboard-app && npm start  # Start frontend

# Testing
npm run test:backend        # Backend tests
npm run test:unit          # All backend unit tests
npm run playwright:test    # E2E tests
npm run test:all           # Everything

# Code Quality
npm run lint               # Check code
npm run lint:fix          # Fix issues
npm run format            # Format code

# Database
npm run db:migrate        # Run migrations
npm run db:seed          # Seed data
npm run db:reset         # Reset database

# Build & Deploy
npm run docker:build     # Build Docker image
npm run docker:run       # Run container
```

## ✅ Verification Status

- ✅ Backend tests: 32 passing
- ✅ Frontend tests: 107 passing (7 files)
- ✅ Linting: Working
- ✅ Build: Successful
- ✅ Configuration: All tools working

## 📊 Impact

### Before
- 20+ files in root directory
- Mixed config/docs/test files
- Hard to navigate

### After
- Clean root with ~10 essential files
- Organized by purpose (config, docs, scripts)
- Professional structure
- Easy to maintain

## 🔍 Need Help?

- Full details: `PROJECT_ORGANIZATION.md`
- Summary: `ORGANIZATION_SUMMARY.md`
- Main docs: `README.md`
