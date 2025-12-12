# Project Organization

This document describes the reorganized file structure for better maintainability.

## What Changed?

All configuration files, documentation, and test results have been organized into dedicated directories.

### New Directory Structure

#### `/config` - Configuration Files
All tool configurations are now centralized:
- `config/babel/` - Babel transpilation configuration
- `config/eslint/` - ESLint linting rules and ignore patterns
- `config/playwright/` - Playwright E2E test configuration and results

#### `/docs` - Documentation
All documentation files are now organized by purpose:
- `docs/guides/` - Developer guides (CONTRIBUTING.md)
- `docs/testing/` - Testing documentation (CI_TEST.md, TESTING_GUIDE.md, TESTING_MIGRATION.md)

#### `/test-results` - Test Results
All test output and reports:
- `test-results/playwright/` - Playwright JSON/XML results
- `test-results/playwright-report/` - HTML test reports

### Root Level Reference Files

For tool compatibility, some files in the root directory now reference configurations in the `/config` directory:
- `.eslintrc.json` → extends `config/eslint/.eslintrc.json`
- `babel.config.js` → requires `config/babel/babel.config.js`
- `playwright.config.js` → requires `config/playwright/playwright.config.js`

### Scripts

All utility scripts remain in `/scripts`:
- `start-servers.sh`
- `stop-servers.sh`
- `test-security.sh`
- `test-pipeline-local.sh` (moved from root)
- `dependency-scan.js`
- `generate-types.js`
- `validate-ci.js`

## Benefits

1. **Clarity**: Related files are grouped together
2. **Maintainability**: Easier to find and update configuration
3. **Scalability**: Room to add more configs without cluttering root
4. **Documentation**: Clear separation of docs by purpose
5. **Clean Root**: Root directory is less cluttered

## Updated Commands

All npm scripts have been updated to reference the new paths. No changes needed to your workflow:

```bash
npm run lint                # Still works
npm run playwright:test     # Still works
npm run playwright:report   # Now shows reports from test-results/
```

## Migration Notes

- All test results are now gitignored and stored in `/test-results`
- Documentation paths updated in README.md
- Configuration files work seamlessly with existing tools
