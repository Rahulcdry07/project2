#!/bin/bash

# Set up the test environment
echo "Setting up test environment..."
bash cypress_env.sh

# Run the API tests in headless mode
echo "Running API tests..."
npx cypress run --spec "cypress/e2e/api_tests.cy.js,cypress/e2e/api_health_check.cy.js,cypress/e2e/smoke_test.cy.js" --browser electron --headless

# Store the exit code
EXIT_CODE=$?

# Print test results summary
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n\033[0;32m✓ All API tests passed!\033[0m"
else
  echo -e "\n\033[0;31m✗ Some API tests failed!\033[0m"
fi

# Clean up
echo "Cleaning up..."
pkill -f "node .*server.js" || true

exit $EXIT_CODE