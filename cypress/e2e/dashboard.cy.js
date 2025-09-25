describe('Dashboard Page', () => {
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
      const user = { username: testUser.username, email: testUser.email };
      
      // Visit the app first to ensure localStorage is available
      cy.visit('/');
      
      // Wait for React to load
      cy.get('#root', { timeout: 10000 }).should('exist');
      
      // Set authentication data in localStorage like the real app does
      cy.window().then((win) => {
        win.localStorage.setItem('token', token);
        win.localStorage.setItem('user', JSON.stringify(user));
        cy.log('Authentication data stored');
      });
      
      // Wait a moment for localStorage to be set
      cy.wait(500);
    });
  });
  
  it('should load the dashboard page and display username', () => {
    // Navigate to dashboard
    cy.visit('/dashboard');
    
    // Wait for React to render and process authentication
    cy.wait(2000);
    
    // Check for dashboard content with more flexible selectors
    cy.get('body').should('contain.text', 'Dashboard', { timeout: 15000 });
    
    // Check for welcome message
    cy.get('body').should('contain.text', 'Welcome', { timeout: 10000 });
    
    // Check for username
    cy.get('body').should('contain.text', 'testuser', { timeout: 10000 });
    
    // Verify we're actually on the dashboard page
    cy.url().should('include', '/dashboard');
  });
  
  it('should navigate to the profile page', () => {
    // Navigate to dashboard first
    cy.visit('/dashboard');
    cy.wait(2000);
    
    // Ensure we're on dashboard
    cy.get('body').should('contain.text', 'Dashboard', { timeout: 15000 });
    
    // Look for Profile link in navigation
    cy.contains('Profile', { timeout: 15000 }).should('be.visible').click();
    
    // Verify we're on the profile page
    cy.url().should('include', '/profile');
    
    // Wait for profile page to load and verify content
    cy.wait(2000);
    cy.get('body').should('contain.text', 'Profile', { timeout: 15000 });
  });
  
  it('should logout successfully', () => {
    // Navigate to dashboard first
    cy.visit('/dashboard');
    cy.wait(2000);
    
    // Ensure we're on dashboard
    cy.get('body').should('contain.text', 'Dashboard', { timeout: 15000 });
    
    // Find and click logout button/link
    cy.contains('Logout', { timeout: 15000 }).should('be.visible').click();
    
    // Should redirect to login page
    cy.url().should('include', '/login');
    
    // Wait for login page to load
    cy.wait(2000);
    cy.get('body').should('contain.text', 'Login', { timeout: 15000 });
    
    // Verify token is removed from localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });
});
