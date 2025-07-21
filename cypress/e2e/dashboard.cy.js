describe('Dashboard Page', () => {
  beforeEach(() => {
    // Clear database before each test
    cy.request('POST', '/api/test/clear-database');
    cy.loginAsUser();
  });

  it('should load the dashboard page', () => {
    cy.get('h1').should('contain', 'Dashboard');
    cy.get('#username').should('contain', 'testuser');
  });

  it('should display user-specific content', () => {
    cy.get('p').should('contain', 'More dashboard content will go here');
  });

  it('should have a logout button', () => {
    cy.get('a[href="/logout"]').should('exist');
  });

  it('should log out the user and redirect to login page', () => {
    cy.get('a[href="/logout"]').click();
    cy.url().should('include', '/login');
  });

  it('should navigate to profile page', () => {
    cy.get('a[href="/profile"]').click();
    cy.url().should('include', '/profile');
  });

  it('should navigate to admin page if user is admin', () => {
    cy.clearDatabase();
    cy.loginAsAdmin();
    cy.get('a[href="/admin"]').click();
    cy.url().should('include', '/admin');
  });

  it('should not show admin link if user is not admin', () => {
    cy.get('a[href="/admin"]').should('not.exist');
  });

  it('should display a welcome message with the username', () => {
    cy.get('p').should('contain', 'Welcome to your dashboard');
    cy.get('#username').should('contain', 'testuser');
  });

  it('should handle API errors when loading dashboard data', () => {
    cy.intercept('GET', '/api/profile', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }).as('profileError');

    cy.reload();
    cy.wait('@profileError');
    
    // Should redirect to login on error
    cy.url().should('include', '/login');
  });

  it('should handle network errors gracefully', () => {
    cy.intercept('GET', '/api/profile', {
      forceNetworkError: true
    }).as('profileNetworkError');

    cy.reload();
    cy.wait('@profileNetworkError');
    
    // Should redirect to login on network error
    cy.url().should('include', '/login');
  });

  it('should redirect to login if token is expired or invalid', () => {
    cy.clearLocalStorage();
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });
});