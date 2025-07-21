/// <reference types="cypress" />

describe('Authentication E2E', () => {
  const testUser = {
    username: `testuser${Date.now()}`,
    email: `testuser${Date.now()}@example.com`,
    password: 'Test@1234!'
  };

  it('registers a new user with valid data', () => {
    cy.visit('/register');
    cy.url().should('include', '/register');
    cy.get('body').should('not.contain', '404');
    cy.get('input#username', { timeout: 10000 }).should('exist');
    cy.get('input#email').should('exist');
    cy.get('input#password').should('exist');
    cy.get('button[type="submit"]').should('exist');
    cy.get('input#username').type(testUser.username);
    cy.get('input#email').type(testUser.email);
    cy.get('input#password').type(testUser.password);
    cy.get('button[type="submit"]').click();
    cy.contains('Registration successful', { timeout: 10000 }).should('exist');
  });

  it('shows validation errors for invalid registration', () => {
    cy.visit('/register');
    cy.url().should('include', '/register');
    cy.get('body').should('not.contain', '404');
    cy.get('input#username', { timeout: 10000 }).should('exist');
    cy.get('input#username').type('a');
    cy.get('input#email').type('not-an-email');
    cy.get('input#password').type('123');
    cy.get('button[type="submit"]').click();
    cy.contains('Username must be').should('exist');
    cy.contains('valid email').should('exist');
    cy.contains('Password must be').should('exist');
  });

  it('prevents login before email verification', () => {
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.get('body').should('not.contain', '404');
    cy.get('input#email', { timeout: 10000 }).should('exist');
    cy.get('input#email').type(testUser.email);
    cy.get('input#password').type(testUser.password);
    cy.get('button[type="submit"]').click();
    cy.contains('verify your email').should('exist');
  });

  it('verifies email via backend test endpoint and logs in', () => {
    cy.request('POST', '/api/test/verify-user', { email: testUser.email });
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.get('body').should('not.contain', '404');
    cy.get('input#email', { timeout: 10000 }).should('exist');
    cy.get('input#email').type(testUser.email);
    cy.get('input#password').type(testUser.password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains(testUser.username).should('exist');
    // Check Navbar initials avatar
    const initials = testUser.username.split(' ').map(w => w[0].toUpperCase()).join('').slice(0, 2);
    cy.get('.navbar-initials-avatar').should('exist').and('have.text', initials);
    cy.get('.navbar-initials-avatar img').should('not.exist');
  });

  it('logs out successfully', () => {
    cy.get('.floating-action-button', { timeout: 10000 }).should('exist').click();
    cy.contains('Logout').should('exist').click();
    cy.url({ timeout: 10000 }).should('include', '/login');
    cy.contains('Login').should('exist');
  });

  it('requests password reset and resets password', () => {
    cy.visit('/forgot-password');
    cy.url().should('include', '/forgot-password');
    cy.get('body').should('not.contain', '404');
    cy.get('input#email', { timeout: 10000 }).should('exist');
    cy.get('input#email').type(testUser.email);
    cy.get('button[type="submit"]').click();
    cy.contains('password reset link').should('exist');

    // Simulate getting reset token from backend
    cy.request('POST', '/api/test/get-reset-token', { email: testUser.email }).then((resp) => {
      const token = resp.body.resetToken;
      cy.visit(`/reset-password?token=${token}`);
      cy.url().should('include', '/reset-password');
      cy.get('body').should('not.contain', '404');
      cy.get('input#password', { timeout: 10000 }).should('exist');
      cy.get('input#password').type('NewTest@1234!');
      cy.get('button[type="submit"]').click();
      cy.contains('Password has been reset').should('exist');
    });
  });

  it('logs in with new password after reset', () => {
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.get('body').should('not.contain', '404');
    cy.get('input#email', { timeout: 10000 }).should('exist');
    cy.get('input#email').type(testUser.email);
    cy.get('input#password').type('NewTest@1234!');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains(testUser.username).should('exist');
  });
}); 