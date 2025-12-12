# Configuration Files

This directory contains all configuration files organized by tool/purpose.

## Structure

### `/eslint`
ESLint configuration for code linting:
- `.eslintrc.json` - ESLint rules and settings
- `.eslintignore` - Files to ignore during linting

### `/babel`
Babel configuration for JavaScript transpilation:
- `babel.config.js` - Babel preset and plugin configuration

### `/playwright`
Playwright configuration for end-to-end testing:
- `playwright.config.js` - Test runner configuration
- `playwright-results.json` - Latest test results (JSON format)
- `playwright-results.xml` - Latest test results (JUnit XML format)

## Root Config Files

Some config files remain in the root directory for tool compatibility:
- `.eslintrc.json` - Extends config from `/config/eslint/`
- `babel.config.js` - References config from `/config/babel/`
- `playwright.config.js` - References config from `/config/playwright/`
- `.sequelizerc` - Sequelize ORM configuration
- `.prettierrc` - Prettier code formatter configuration
- `.nvmrc` - Node version specification
