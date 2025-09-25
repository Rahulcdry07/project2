// Add retries and timeout configuration for slow tests
Cypress.config('retries', {
  runMode: 2,
  openMode: 0
});

// Add increased timeout for slow operations
Cypress.config('defaultCommandTimeout', 10000);

// Hook to check if the server is running before each test
beforeEach(() => {
  // First check if the server is accessible
  cy.request({
    url: 'http://0.0.0.0:3000/api',
    failOnStatusCode: false,
  }).then(response => {
    if (response.status !== 200) {
      cy.log('Server may not be running correctly. Status:', response.status);
    }
  });

  cy.log('Clearing database before test...');
  cy.request({
    method: 'POST',
    url: 'http://0.0.0.0:3000/api/test/clear-database',
    failOnStatusCode: false
  }).then(response => {
    if (response.status !== 200) {
      cy.log(`Failed to clear database: ${response.status}`);
      cy.log(JSON.stringify(response.body));
    } else {
      cy.log('Database cleared successfully');
    }
  });
  cy.wait(500); // Add a small wait to ensure database is cleared
});

// Improved login as admin command that works more reliably
Cypress.Commands.add('loginAsAdmin', () => {
  cy.log('Starting loginAsAdmin process');
  
  const adminUser = {
    username: 'adminuser',
    email: 'admin@example.com',
    password: 'adminpassword',
  };
  
  // Create admin user with more explicit logging
  cy.request({ 
    method: 'POST', 
    url: 'http://0.0.0.0:3000/api/auth/register', 
    body: adminUser, 
    failOnStatusCode: false 
  }).then(response => {
    cy.log(`Admin user registration response: ${response.status}`);
  });
  
  // Verify the admin user
  cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: adminUser.email })
    .then(response => {
      cy.log(`Admin user verification response: ${response.status}`);
    });
  
  // Set admin role
  cy.request('POST', 'http://0.0.0.0:3000/api/test/set-user-role', { email: adminUser.email, role: 'admin' })
    .then(response => {
      cy.log(`Admin role set response: ${response.status}`);
    });

  // Login to get JWT token
  cy.request({
    method: 'POST', 
    url: 'http://0.0.0.0:3000/api/auth/login', 
    body: { email: adminUser.email, password: adminUser.password }
  }).then((response) => {
    const token = response.body.data.token;
    expect(token).to.exist;
    cy.log('Admin login successful, token received');
    
    // Visit the app first to ensure localStorage is available
    cy.visit('/');
    
    // Wait for React to load
    cy.get('#root', { timeout: 10000 }).should('exist');
    
    // Store token and user in localStorage
    cy.window().then((win) => {
      const user = { 
        username: adminUser.username, 
        email: adminUser.email, 
        role: 'admin' 
      };
      
      win.localStorage.setItem('token', token);
      win.localStorage.setItem('user', JSON.stringify(user));
      cy.log('Admin authentication data stored in localStorage');
    });
    
    // Wait a moment for localStorage to be set
    cy.wait(500);
  });
});

// Add a command to wait for elements with increased timeout
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout });
});

// Add a command to check if an element exists without failing
Cypress.Commands.add('exists', (selector) => {
  cy.get('body').then($body => {
    return $body.find(selector).length > 0;
  });
});

// Add a command to debug the current page
Cypress.Commands.add('debugPage', () => {
  cy.log('Debugging current page');
  
  // Log current URL
  cy.url().then(url => {
    cy.log(`Current URL: ${url}`);
  });
  
  // Log localStorage contents
  cy.window().then(win => {
    cy.log('LocalStorage contents:');
    Object.keys(win.localStorage).forEach(key => {
      const value = win.localStorage.getItem(key);
      cy.log(`${key}: ${value ? value.substring(0, 20) + '...' : 'null'}`);
    });
  });
  
  // Log HTML content of the page (first 200 chars)
  cy.document().then(doc => {
    cy.log(`Page content: ${doc.body.innerHTML.substring(0, 200)}...`);
  });
  
  // Log any errors in the console
  cy.window().then(win => {
    cy.spy(win.console, 'error').as('consoleError');
  });
});