#!/usr/bin/env node

/**
 * CI Pipeline Validation Script
 * Checks that all necessary dependencies and scripts are available for CI/CD
 */

const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

const allowedScripts = new Set([
  'lint',
  'test:backend',
  'start:ci',
  'playwright:test',
  'test:ci',
  'build',
  'start'
]);

const repoRoot = path.resolve(process.cwd());
const allowedPaths = new Map();

const registerPath = (relativePath) => {
  allowedPaths.set(relativePath, path.resolve(repoRoot, relativePath));
};

[
  '.github/workflows/ci-cd.yml',
  '.github/workflows/test.yml',
  '.github/workflows/deploy.yml',
  '.github/workflows/security-scan.yml',
  'package.json',
  'public/dashboard-app/package.json',
  'playwright.config.js',
  'tests/playwright',
  'public/dashboard-app/vitest.config.js',
  '.eslintrc.json',
  '.eslintrc.js',
  'public/dashboard-app/.eslintrc.json',
  'public/dashboard-app/.eslintrc.js',
  'cypress.config.js',
  'cypress/',
  '.env.cypress',
  'run_cypress_tests.sh'
].forEach(registerPath);

const getSafePath = (relativePath) => {
  const safePath = allowedPaths.get(relativePath);
  if (!safePath) {
    throw new Error(`Attempted to access unregistered path: ${relativePath}`);
  }
  if (!safePath.startsWith(repoRoot)) {
    throw new Error(`Path escapes repository root: ${relativePath}`);
  }
  return safePath;
};

const getSafeScriptName = (scriptName) => {
  if (!allowedScripts.has(scriptName)) {
    throw new Error(`Script ${scriptName} is not allowlisted for CI validation.`);
  }
  return scriptName;
};

function checkFileExists(filePath, description) {
  const safePath = getSafePath(filePath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (fs.existsSync(safePath)) {
    logger.info(`✅ ${description}: ${filePath}`);
    return true;
  }
  logger.warn(`❌ ${description} MISSING: ${filePath}`);
  return false;
}

function checkPackageScript(packagePath, scriptName, description) {
  const safePackagePath = getSafePath(packagePath);
  const safeScriptName = getSafeScriptName(scriptName);

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(safePackagePath)) {
    logger.warn(`❌ Package file missing: ${packagePath}`);
    return false;
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const pkg = JSON.parse(fs.readFileSync(safePackagePath, 'utf8'));
  const scripts = pkg && typeof pkg.scripts === 'object' ? pkg.scripts : {};

  if (Object.prototype.hasOwnProperty.call(scripts, safeScriptName)) {
    // eslint-disable-next-line security/detect-object-injection
    const scriptValue = scripts[safeScriptName];
    logger.info(`✅ ${description}: ${safeScriptName} -> ${scriptValue}`);
    return true;
  }

  logger.warn(`❌ ${description} MISSING: ${safeScriptName}`);
  return false;
}

const recordCheck = (result) => {
  if (!result) {
    allChecksPass = false;
  }
};

logger.info('🔍 Validating CI/CD Pipeline Configuration...');

let allChecksPass = true;

// Check workflow files
logger.info('📁 Checking GitHub Actions workflows:');
recordCheck(checkFileExists('.github/workflows/ci-cd.yml', 'Main CI/CD Pipeline'));
recordCheck(checkFileExists('.github/workflows/test.yml', 'Test Suite'));
recordCheck(checkFileExists('.github/workflows/deploy.yml', 'Deploy Pipeline'));
recordCheck(checkFileExists('.github/workflows/security-scan.yml', 'Security Scan'));

logger.info('📦 Checking package.json scripts:');

// Check backend scripts
const backendPkg = 'package.json';
recordCheck(checkPackageScript(backendPkg, 'lint', 'Backend Lint'));
recordCheck(checkPackageScript(backendPkg, 'test:backend', 'Backend Tests'));
recordCheck(checkPackageScript(backendPkg, 'start:ci', 'CI Server Start'));
recordCheck(checkPackageScript(backendPkg, 'playwright:test', 'Playwright Tests'));

// Check frontend scripts
const frontendPkg = 'public/dashboard-app/package.json';
recordCheck(checkPackageScript(frontendPkg, 'lint', 'Frontend Lint'));
recordCheck(checkPackageScript(frontendPkg, 'test:ci', 'Frontend CI Tests'));
recordCheck(checkPackageScript(frontendPkg, 'build', 'Frontend Build'));
recordCheck(checkPackageScript(frontendPkg, 'start', 'Frontend Start'));

logger.info('🧪 Checking test configuration:');
recordCheck(checkFileExists('playwright.config.js', 'Playwright Config'));
recordCheck(checkFileExists('tests/playwright', 'Playwright Tests Directory'));
recordCheck(checkFileExists('public/dashboard-app/vitest.config.js', 'Vitest Config'));

logger.info('🔧 Checking other essential files:');
recordCheck(
  checkFileExists('.eslintrc.json', 'ESLint Config') ||
    checkFileExists('.eslintrc.js', 'ESLint Config')
);
recordCheck(
  checkFileExists('public/dashboard-app/.eslintrc.json', 'Frontend ESLint Config') ||
    checkFileExists('public/dashboard-app/.eslintrc.js', 'Frontend ESLint Config')
);

// Check for removed Cypress files
logger.info('🚫 Checking for removed Cypress files:');
const cypressFiles = [
  'cypress.config.js',
  'cypress/',
  '.env.cypress',
  'run_cypress_tests.sh'
];

cypressFiles.forEach(file => {
  const safePath = getSafePath(file);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(safePath)) {
    logger.info(`✅ Cypress file correctly removed: ${file}`);
  } else {
    logger.warn(`⚠️  Cypress file still exists: ${file}`);
    allChecksPass = false;
  }
});

logger.info('='.repeat(50));
if (allChecksPass) {
  logger.info('✅ All CI/CD Pipeline checks PASSED!');
  logger.info('🚀 Pipeline is ready for GitHub Actions');
  process.exit(0);
} else {
  logger.error('❌ Some CI/CD Pipeline checks FAILED!');
  logger.info('🔧 Please fix the issues above before running CI/CD');
  process.exit(1);
}