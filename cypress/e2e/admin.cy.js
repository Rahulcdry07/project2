/// <reference types="cypress" />

describe('Admin Panel & Role-Based Access E2E', () => {
  const adminUser = {
    username: `admin${Date.now()}`,
    email: `admin${Date.now()}@example.com`,
    password: 'Admin@1234!',
    role: 'admin'
  };
  const normalUser = {
    username: `user${Date.now()}`,
    email: `user${Date.now()}@example.com`,
    password: 'User@1234!',
    role: 'user'
  };

  before(() => {
    cy.request('POST', '/api/register', {
      username: adminUser.username,
      email: adminUser.email,
      password: adminUser.password
    });
    cy.request('POST', '/api/register', {
      username: normalUser.username,
      email: normalUser.email,
      password: normalUser.password
    });
    cy.request('POST', '/api/test/verify-user', { email: adminUser.email });
    cy.request('POST', '/api/test/verify-user', { email: normalUser.email });
    cy.request('POST', '/api/test/set-user-role', { email: adminUser.email, role: 'admin' });
    cy.request('POST', '/api/test/set-user-role', { email: normalUser.email, role: 'user' });
  });

  it('allows admin to access admin panel and manage users', () => {
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.get('body').should('not.contain', '404');
    cy.get('input#email', { timeout: 10000 }).should('exist');
    cy.get('input#email').type(adminUser.email);
    cy.get('input#password').type(adminUser.password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.get('.floating-action-button', { timeout: 10000 }).should('exist').click();
    cy.contains('Admin Panel').should('exist').click();
    cy.url({ timeout: 10000 }).should('include', '/admin');
    cy.get('body').should('not.contain', '404');
    cy.contains('User Management').should('exist');
    cy.contains(normalUser.username).should('exist');
    cy.contains(adminUser.username).should('exist');
  });

  it('allows admin to change user role', () => {
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    cy.get('body').should('not.contain', '404');
    cy.contains(normalUser.username, { timeout: 10000 }).parent().find('select').select('admin');
    cy.contains('Role updated').should('exist');
    cy.contains(normalUser.username).parent().find('select').select('user');
    cy.contains('Role updated').should('exist');
  });

  it('prevents normal user from accessing admin panel', () => {
    cy.get('.floating-action-button', { timeout: 10000 }).should('exist').click();
    cy.contains('Logout').should('exist').click();
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.get('body').should('not.contain', '404');
    cy.get('input#email', { timeout: 10000 }).should('exist');
    cy.get('input#email').type(normalUser.email);
    cy.get('input#password').type(normalUser.password);
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    cy.get('body').should('not.contain', '404');
    cy.contains('Forbidden').should('exist');
    cy.get('.floating-action-button', { timeout: 10000 }).should('exist').click();
    cy.contains('Admin Panel').should('not.exist');
  });
});
