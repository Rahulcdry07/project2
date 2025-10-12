#!/usr/bin/env node

/**
 * CI Pipeline Validation Script
 * Checks that all necessary dependencies and scripts are available for CI/CD
 */

const fs = require('fs');
const path = require('path');

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`❌ ${description} MISSING: ${filePath}`);
    return false;
  }
}

function checkPackageScript(packagePath, scriptName, description) {
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (pkg.scripts && pkg.scripts[scriptName]) {
      console.log(`✅ ${description}: ${scriptName} -> ${pkg.scripts[scriptName]}`);
      return true;
    } else {
      console.log(`❌ ${description} MISSING: ${scriptName}`);
      return false;
    }
  } else {
    console.log(`❌ Package file missing: ${packagePath}`);
    return false;
  }
}

console.log('🔍 Validating CI/CD Pipeline Configuration...\n');

let allChecksPass = true;

// Check workflow files
console.log('📁 Checking GitHub Actions workflows:');
allChecksPass &= checkFileExists('.github/workflows/ci-cd.yml', 'Main CI/CD Pipeline');
allChecksPass &= checkFileExists('.github/workflows/test.yml', 'Test Suite');
allChecksPass &= checkFileExists('.github/workflows/deploy.yml', 'Deploy Pipeline');
allChecksPass &= checkFileExists('.github/workflows/security-scan.yml', 'Security Scan');

console.log('\n📦 Checking package.json scripts:');

// Check backend scripts
const backendPkg = 'package.json';
allChecksPass &= checkPackageScript(backendPkg, 'lint', 'Backend Lint');
allChecksPass &= checkPackageScript(backendPkg, 'test:backend', 'Backend Tests');
allChecksPass &= checkPackageScript(backendPkg, 'start:ci', 'CI Server Start');
allChecksPass &= checkPackageScript(backendPkg, 'playwright:test', 'Playwright Tests');

// Check frontend scripts
const frontendPkg = 'public/dashboard-app/package.json';
allChecksPass &= checkPackageScript(frontendPkg, 'lint', 'Frontend Lint');
allChecksPass &= checkPackageScript(frontendPkg, 'test:ci', 'Frontend CI Tests');
allChecksPass &= checkPackageScript(frontendPkg, 'build', 'Frontend Build');
allChecksPass &= checkPackageScript(frontendPkg, 'start', 'Frontend Start');

console.log('\n🧪 Checking test configuration:');
allChecksPass &= checkFileExists('playwright.config.js', 'Playwright Config');
allChecksPass &= checkFileExists('tests/playwright', 'Playwright Tests Directory');
allChecksPass &= checkFileExists('public/dashboard-app/vitest.config.js', 'Vitest Config');

console.log('\n🔧 Checking other essential files:');
allChecksPass &= checkFileExists('.eslintrc.json', 'ESLint Config') || checkFileExists('.eslintrc.js', 'ESLint Config');
allChecksPass &= checkFileExists('public/dashboard-app/.eslintrc.json', 'Frontend ESLint Config') || checkFileExists('public/dashboard-app/.eslintrc.js', 'Frontend ESLint Config');

// Check for removed Cypress files
console.log('\n🚫 Checking for removed Cypress files:');
const cypressFiles = [
  'cypress.config.js',
  'cypress/',
  '.env.cypress',
  'run_cypress_tests.sh'
];

cypressFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`✅ Cypress file correctly removed: ${file}`);
  } else {
    console.log(`⚠️  Cypress file still exists: ${file}`);
    allChecksPass = false;
  }
});

console.log('\n' + '='.repeat(50));
if (allChecksPass) {
  console.log('✅ All CI/CD Pipeline checks PASSED!');
  console.log('🚀 Pipeline is ready for GitHub Actions');
  process.exit(0);
} else {
  console.log('❌ Some CI/CD Pipeline checks FAILED!');
  console.log('🔧 Please fix the issues above before running CI/CD');
  process.exit(1);
}