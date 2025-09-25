describe('Dashboard Page - Fixed', () => {
  beforeEach(() => {
    // Clear database and create fresh test user
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database');
    
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    
    cy.log('Creating and verifying test user');
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/register', testUser);
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: testUser.email });
    
    // Get login token
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/login',
      body: { email: testUser.email, password: testUser.password }
    }).then((response) => {
      const token = response.body.data.token;
      const user = response.body.data.user || { username: testUser.username, email: testUser.email };
      
      // Visit the app first
      cy.visit('/');
      
      // Set authentication data in localStorage like the real app does
      cy.window().then((win) => {
        win.localStorage.setItem('token', token);
        win.localStorage.setItem('user', JSON.stringify(user));
        cy.log('Authentication data stored');
      });
    });
  });
  
  it('should load the dashboard page and display content', () => {
    // Navigate to dashboard
    cy.visit('/dashboard');
    
    // Wait for React to render - the app might take time to load
    cy.get('#root', { timeout: 10000 }).should('be.visible');
    
    // Wait for authentication context to load
    cy.wait(1000);
    
    // Check for the dashboard content - use the same approach as the working dashboard test
    cy.contains('Welcome', { timeout: 15000 }).should('be.visible');
    
    // Verify username is displayed somewhere on the page
    cy.contains('testuser', { timeout: 10000 }).should('be.visible');
  });
  
  it('should navigate to the profile page from dashboard', () => {
    cy.visit('/dashboard');
    
    // Wait for dashboard to load
    cy.get('h1').contains('Dashboard', { timeout: 15000 }).should('be.visible');
    
    // Look for Profile link in navigation
    cy.contains('a, .nav-link', 'Profile', { timeout: 10000 }).should('be.visible').click();
    
    // Verify we're on the profile page
    cy.url().should('include', '/profile');
    
    // Wait for profile page to load
    cy.contains('Profile', { timeout: 15000 }).should('be.visible');
  });
  
  it('should logout successfully', () => {
    cy.visit('/dashboard');
    
    // Wait for dashboard to load
    cy.get('h1').contains('Dashboard', { timeout: 15000 }).should('be.visible');
    
    // Find and click logout button/link
    cy.contains('button, a, .nav-link', 'Logout', { timeout: 10000 })
      .should('be.visible')
      .click();
    
    // Should redirect to login page
    cy.url().should('include', '/login');
    
    // Verify login page loads
    cy.contains('Login', { timeout: 10000 }).should('be.visible');
    
    // Verify token is removed from localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });
  
  it('should handle unauthenticated access properly', () => {
    // Visit dashboard without being logged in
    cy.visit('/');
    
    // Clear any authentication data
    cy.window().then((win) => {
      win.localStorage.removeItem('token');
      win.localStorage.removeItem('user');
    });
    
    // Now try to visit dashboard
    cy.visit('/dashboard');
    
    // Should redirect to login
    cy.url().should('include', '/login');
    cy.contains('Login', { timeout: 10000 }).should('be.visible');
  });
});