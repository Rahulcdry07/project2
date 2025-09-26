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
      const token = response.body.data.token;
      
      // Visit dashboard and set token in localStorage via window
      cy.visit('/dashboard');
      cy.window().then((win) => {
        win.localStorage.setItem('token', token);
        // Also set user data to help with React context
        win.localStorage.setItem('user', JSON.stringify({
          id: response.body.data.user.id,
          username: testUser.username,
          email: testUser.email,
          role: 'user'
        }));
      });
      
      // Refresh to make sure React picks up the token
      cy.reload();
    });
    
    cy.get('#root', { timeout: 10000 }).should('be.visible');
    
    // Wait for React to initialize properly
    cy.wait(1000);
  });
  
  it('should load the dashboard page and display username', () => {
    cy.contains('h1', 'Dashboard', { timeout: 10000 }).should('be.visible');
    cy.contains('Welcome to your dashboard, testuser!').should('be.visible');
  });
  
  it('should navigate to the profile page', () => {
    // Wait for the navbar to be visible and for user to be loaded
    cy.get('.navbar', { timeout: 10000 }).should('be.visible');
    
    // Debug what nav links are available
    cy.get('.navbar .nav-link').then($links => {
      cy.log(`Found ${$links.length} nav links`);
      $links.each((index, link) => {
        cy.log(`Nav link ${index}: ${link.textContent.trim()}`);
      });
    });
    
    // Use a more flexible selector
    cy.get('.navbar').contains('Profile', { timeout: 10000 }).click();
    cy.url().should('include', '/profile');
    cy.contains('h1', 'User Profile', { timeout: 10000 }).should('be.visible');
  });
  
  it('should logout successfully', () => {
    // Ensure the navbar is visible
    cy.get('.navbar', { timeout: 10000 }).should('be.visible');
    
    // Debug what buttons/links are available
    cy.get('.navbar').then($navbar => {
      cy.log('Navbar HTML:', $navbar.html().substring(0, 200) + '...');
    });
    
    // If the navigation is collapsed (mobile view), expand it first
    cy.get('.navbar').then($nav => {
      if ($nav.find('.navbar-toggler').is(':visible')) {
        cy.get('.navbar-toggler').click();
        // Wait for the collapse to open
        cy.get('.navbar-collapse', { timeout: 5000 }).should('have.class', 'show');
      }
    });
    
    // Look for logout button with a more flexible selector
    cy.get('.navbar').contains('Logout', { timeout: 10000 })
      .should('be.visible')
      .click();
    
    // Check that we've been redirected to the login page
    cy.url().should('include', '/login');
    cy.contains('h1', 'Login', { timeout: 10000 }).should('be.visible');
    
    // Verify the token has been removed
    cy.window().its('localStorage.token').should('not.exist');
  });
});
