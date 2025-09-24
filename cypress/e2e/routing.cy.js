describe('Client-side Routing', () => {
  beforeEach(() => {
    // Start from the home page for each test
    cy.visit('/');
    cy.get('#root', { timeout: 10000 }).should('be.visible');
  });

  it('should load the /register page', () => {
    cy.visit('/register');
    cy.url().should('include', '/register');
    cy.contains('h2', 'Register').should('be.visible');
  });

  it('should load the /login page', () => {
    cy.visit('/login');
    cy.url().should('include', '/login');
    cy.contains('h2', 'Login').should('be.visible');
  });

  it('should redirect to /login when accessing a protected route without authentication', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should load the /forgot-password page', () => {
    cy.visit('/forgot-password');
    cy.url().should('include', '/forgot-password');
    cy.contains('h2', 'Forgot Your Password?').should('be.visible');
  });
});
