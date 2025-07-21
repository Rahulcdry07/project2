/// <reference types="cypress" />

describe('Profile Update E2E', () => {
  const testUser = {
    username: `profileuser${Date.now()}`,
    email: `profileuser${Date.now()}@example.com`,
    password: 'Test@1234!'
  };

  before(() => {
    cy.request('POST', '/api/register', {
      username: testUser.username,
      email: testUser.email,
      password: testUser.password
    });
    cy.request('POST', '/api/test/verify-user', { email: testUser.email });
  });

  beforeEach(() => {
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.get('body').should('not.contain', '404');
    cy.get('input#email', { timeout: 10000 }).should('exist');
    cy.get('input#email').type(testUser.email);
    cy.get('input#password').type(testUser.password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains('Dashboard').should('exist');
  });

  it('updates profile fields', () => {
    cy.visit('/profile');
    cy.url().should('include', '/profile');
    cy.get('body').should('not.contain', '404');
    cy.get('textarea[name="bio"]', { timeout: 10000 }).should('exist');
    cy.get('textarea[name="bio"]').clear().type('This is my new bio!');
    cy.get('input[name="location"]').clear().type('New York');
    cy.get('input[name="website"]').clear().type('https://example.com');
    cy.get('button[type="submit"]').click();
    cy.contains('Profile updated successfully').should('exist');
    cy.get('textarea[name="bio"]').should('have.value', 'This is my new bio!');
    cy.get('input[name="location"]').should('have.value', 'New York');
    cy.get('input[name="website"]').should('have.value', 'https://example.com');
  });

  it('does not render image upload or profile picture', () => {
    cy.visit('/profile');
    cy.url().should('include', '/profile');
    cy.get('body').should('not.contain', '404');
    cy.get('input[type="file"]').should('not.exist');
    cy.get('img').should('not.exist');
    cy.contains(/upload/i).should('not.exist');
    cy.contains(/remove/i).should('not.exist');
    cy.get('form').should('exist');
    cy.contains(/account statistics/i).should('exist');
    cy.contains(/change password/i).should('exist');
  });

  it('shows updated profile completion', () => {
    cy.visit('/profile');
    cy.url().should('include', '/profile');
    cy.get('body').should('not.contain', '404');
    cy.get('.profile-completion', { timeout: 10000 }).should('exist');
    cy.get('.profile-completion').invoke('text').then((text) => {
      const percent = parseInt(text);
      expect(percent).to.be.greaterThan(0);
    });
  });

  it('changes password and logs in with new password', () => {
    cy.visit('/profile');
    cy.url().should('include', '/profile');
    cy.get('body').should('not.contain', '404');
    cy.get('input[name="oldPassword"]', { timeout: 10000 }).should('exist');
    cy.get('input[name="oldPassword"]').type(testUser.password);
    cy.get('input[name="newPassword"]').type('NewProfile@1234!');
    cy.get('button[type="submit"]').contains('Change Password').click();
    cy.contains('Password changed successfully').should('exist');

    // Logout and login with new password
    cy.get('.floating-action-button', { timeout: 10000 }).should('exist').click();
    cy.contains('Logout').should('exist').click();
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.get('body').should('not.contain', '404');
    cy.get('input#email', { timeout: 10000 }).should('exist');
    cy.get('input#email').type(testUser.email);
    cy.get('input#password').type('NewProfile@1234!');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains('Dashboard').should('exist');
  });
});