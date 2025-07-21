#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const testConfig = {
  timeout: 10000,
  reporter: 'spec',
  require: path.join(__dirname, 'test.config.js')
};

// Available test suites
const testSuites = {
  'backend': 'test/backend.test.js',
  'security': 'test/security.test.js',
  'integration': 'test/integration.test.js',
  'all': 'test/*.test.js'
};

// Parse command line arguments
const args = process.argv.slice(2);
const suite = args[0] || 'all';
const options = args.slice(1);

if (!testSuites[suite]) {
  console.error(`❌ Unknown test suite: ${suite}`);
  console.log('Available test suites:');
  Object.keys(testSuites).forEach(key => {
    console.log(`  - ${key}`);
  });
  process.exit(1);
}

// Build mocha command
const mochaArgs = [
  '--timeout', testConfig.timeout.toString(),
  '--reporter', testConfig.reporter,
  '--require', testConfig.require,
  testSuites[suite],
  ...options
];

console.log(`🚀 Running ${suite} tests...`);
console.log(`📁 Test file: ${testSuites[suite]}`);
console.log(`⏱️  Timeout: ${testConfig.timeout}ms`);
console.log(`📊 Reporter: ${testConfig.reporter}`);
console.log('');

// Run tests
const mocha = spawn('npx', ['mocha', ...mochaArgs], {
  stdio: 'inherit',
  shell: true
});

mocha.on('close', (code) => {
  console.log('');
  if (code === 0) {
    console.log('✅ All tests passed!');
  } else {
    console.log(`❌ Tests failed with exit code ${code}`);
  }
  process.exit(code);
});

mocha.on('error', (error) => {
  console.error('❌ Failed to start test runner:', error.message);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test run interrupted');
  mocha.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test run terminated');
  mocha.kill('SIGTERM');
}); 