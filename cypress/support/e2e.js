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
    const user = response.body.data.user;
    expect(token).to.exist;
    expect(user).to.exist;
    expect(user.role).to.eq('admin');
    cy.log('Admin login successful, token and user data received');
    
    // Visit any page to set localStorage (need a page context)
    cy.visit('/');
    
    // Store both token and user data in localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('token', token);
      win.localStorage.setItem('user', JSON.stringify(user));
      cy.log('Token and user data stored in localStorage');
      
      // Verify both were stored correctly
      const storedToken = win.localStorage.getItem('token');
      const storedUser = JSON.parse(win.localStorage.getItem('user'));
      expect(storedToken).to.eq(token);
      expect(storedUser.role).to.eq('admin');
      cy.log('Token and user data verification successful');
    });
  });
  
  // Additional verification by accessing profile API
  cy.window().then((win) => {
    const token = win.localStorage.getItem('token');
    cy.log(`Verifying authentication with token: ${token ? token.substring(0, 20) + '...' : 'null'}`);
    
    if (token) {
      cy.request({
        method: 'GET',
        url: 'http://0.0.0.0:3000/api/profile',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then(response => {
        cy.log(`Profile API verification response: ${response.status}`);
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('username', 'adminuser');
        expect(response.body).to.have.property('role', 'admin');
        cy.log('Admin authentication verified successfully');
      });
    } else {
      cy.log('Warning: No token found in localStorage');
    }
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