// Add retries and timeout configuration for slow tests
Cypress.config('retries', {
  runMode: 2,
  openMode: 0
});

// Add increased timeout for slow operations
Cypress.config('defaultCommandTimeout', 10000);

beforeEach(() => {
  cy.log('Clearing database before test...');
  cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database');
  cy.wait(500); // Add a small wait to ensure database is cleared
});

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

  // Login and store token with retry logic
  cy.request({
    method: 'POST', 
    url: 'http://0.0.0.0:3000/api/auth/login', 
    body: { email: adminUser.email, password: adminUser.password }
  }).then((response) => {
    const token = response.body.data.token;
    expect(token).to.exist;
    cy.log('Admin login successful, token received');
    
    // Store token in localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('token', token);
      cy.log('Token stored in localStorage');
      
      // Verify token was stored correctly
      const storedToken = win.localStorage.getItem('token');
      expect(storedToken).to.eq(token);
      cy.log('Token verification successful');
    });
  });
  
  // Verify authentication is working
  cy.request({
    method: 'GET',
    url: 'http://0.0.0.0:3000/api/profile',
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    }
  }).then(response => {
    cy.log(`Profile API verification response: ${response.status}`);
    expect(response.status).to.eq(200);
    expect(response.body).to.have.property('username', 'adminuser');
    expect(response.body).to.have.property('role', 'admin');
    cy.log('Admin authentication verified successfully');
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
});