#!/bin/bash

# Set up the test environment
echo "Setting up test environment for UI tests..."
bash cypress_env.sh

# Run the fixed UI tests in headless mode
echo "Running fixed UI tests..."
npx cypress run --spec "cypress/e2e/dashboard.cy.js,cypress/e2e/admin.cy.js,cypress/e2e/login.cy.js,cypress/e2e/dashboard_fixed.cy.js" --browser electron --headless

# Store the exit code
EXIT_CODE=$?

# Print test results summary
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n\033[0;32m✓ All UI tests passed!\033[0m"
else
  echo -e "\n\033[0;31m✗ Some UI tests failed!\033[0m"
fi

# Clean up
echo "Cleaning up..."
sudo pkill -f "node.*server.js" || true

exit $EXIT_CODE