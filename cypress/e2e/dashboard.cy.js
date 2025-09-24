describe('Dashboard Page', () => {
  beforeEach(() => {
    // Register and verify a test user
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/register', testUser);
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: testUser.email });
    
    // Login and store the token
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/login', {
      email: testUser.email,
      password: testUser.password,
    }).then((response) => {
      expect(response.body.data.token).to.exist;
      window.localStorage.setItem('token', response.body.data.token);
    });
    
    // Visit the dashboard
    cy.visit('/dashboard');
    cy.get('#root', { timeout: 10000 }).should('be.visible');
  });
  
  it('should load the dashboard page and display username', () => {
    cy.contains('h1', 'Dashboard', { timeout: 10000 }).should('be.visible');
    cy.contains('Welcome back, testuser').should('be.visible');
  });
  
  it('should navigate to the profile page', () => {
    // Click the profile link in the navbar
    cy.contains('a', 'Profile').click();
    cy.url().should('include', '/profile');
    cy.contains('h1', 'User Profile', { timeout: 10000 }).should('be.visible');
  });
  
  it('should logout successfully', () => {
    // Expanded selector to find the logout button
    // First, ensure we can see the navigation
    cy.get('nav').should('be.visible');
    
    // If the navigation is collapsed (mobile view), expand it first
    cy.get('nav').then($nav => {
      if ($nav.find('.navbar-toggler').is(':visible')) {
        cy.get('.navbar-toggler').click();
        // Wait for the collapse to open
        cy.get('.navbar-collapse').should('be.visible');
      }
    });
    
    // Now look for the logout button with a more robust selector
    cy.contains('a, button, .nav-link', 'Logout', { timeout: 10000 })
      .should('be.visible')
      .click();
    
    // Check that we've been redirected to the login page
    cy.url().should('include', '/login');
    cy.contains('h1', 'Login', { timeout: 10000 }).should('be.visible');
    
    // Verify the token has been removed
    cy.window().its('localStorage.token').should('be.undefined');
  });
});
