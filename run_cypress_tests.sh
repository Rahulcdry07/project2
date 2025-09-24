#!/bin/bash

# Function to run a test and report results
run_test() {
  local test_file=$1
  local test_name=$(basename "$test_file")
  
  echo "Running test: $test_name..."
  npm run cy:run -- --spec "$test_file"
  
  if [ $? -eq 0 ]; then
    echo "✅ $test_name: PASSED"
    return 0
  else
    echo "❌ $test_name: FAILED"
    return 1
  fi
}

# Setup environment for testing
echo "Setting up test environment..."
./cypress_env.sh

# Update Cypress URLs
./update_cypress_urls.sh

# Run each test individually
failures=0

for test_file in cypress/e2e/*.cy.js; do
  run_test "$test_file"
  if [ $? -ne 0 ]; then
    ((failures++))
  fi
done

echo "-----------------------------"
echo "Test Results:"
echo "-----------------------------"
if [ $failures -eq 0 ]; then
  echo "✅ All tests passed successfully!"
else
  echo "❌ $failures test(s) failed."
fi
