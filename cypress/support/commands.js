// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to register a user
Cypress.Commands.add('registerUser', (userData) => {
  return cy.request({
    method: 'POST',
    url: '/api/register',
    body: userData,
    failOnStatusCode: false
  });
});

// Custom command to verify a user's email
Cypress.Commands.add('verifyUser', (email) => {
  return cy.request({
    method: 'POST',
    url: '/api/test/verify-user',
    body: { email }
  });
});

// Custom command to set user role
Cypress.Commands.add('setUserRole', (email, role) => {
  return cy.request({
    method: 'POST',
    url: '/api/test/set-user-role',
    body: { email, role }
  });
});

// Custom command to clear database
Cypress.Commands.add('clearDatabase', () => {
  return cy.request('POST', '/api/test/clear-database');
});

// Custom command to login as a regular user
Cypress.Commands.add('loginAsUser', () => {
  const user = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPass123!',
  };

  // Register and verify user
  cy.request('POST', '/api/register', user);
  cy.request('POST', '/api/test/verify-user', { email: user.email });

  // Login and set tokens
  cy.request('POST', '/api/login', { email: user.email, password: user.password })
    .then((response) => {
      const { token, refreshToken } = response.body;
      expect(token).to.exist;
      expect(refreshToken).to.exist;
      cy.visit('/dashboard', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('refreshToken', refreshToken);
        },
      });
    });
});

// Custom command to login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  const admin = {
    username: 'admin',
    email: 'admin@example.com',
    password: 'AdminPass123!',
  };

  // Register and verify admin
  cy.request('POST', '/api/register', admin);
  cy.request('POST', '/api/test/verify-user', { email: admin.email });
  cy.request('POST', '/api/test/set-user-role', { email: admin.email, role: 'admin' });

  // Login and set tokens
  cy.request('POST', '/api/login', { email: admin.email, password: admin.password })
    .then((response) => {
      const { token, refreshToken } = response.body;
      expect(token).to.exist;
      expect(refreshToken).to.exist;
      cy.visit('/dashboard', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('refreshToken', refreshToken);
        },
      });
    });
});

// Custom command for keyboard navigation (without tab plugin)
Cypress.Commands.add('navigateWithKeyboard', (startSelector, targetSelector) => {
  cy.get(startSelector).focus();
  cy.get(startSelector).type('\t');
  cy.get(targetSelector).should('be.focused');
});

// Custom command to get refresh token for testing
Cypress.Commands.add('getRefreshToken', (email) => {
  return cy.request({
    method: 'POST',
    url: '/api/test/get-refresh-token',
    body: { email }
  });
});

// Custom command to test refresh token functionality
Cypress.Commands.add('testRefreshToken', (email) => {
  cy.getRefreshToken(email).then((response) => {
    const refreshToken = response.body.refreshToken;
    expect(refreshToken).to.exist;
    
    cy.request({
      method: 'POST',
      url: '/api/refresh-token',
      body: { refreshToken }
    }).then((refreshResponse) => {
      expect(refreshResponse.status).to.eq(200);
      expect(refreshResponse.body.token).to.exist;
    });
  });
}); 