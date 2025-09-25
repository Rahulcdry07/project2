describe('Dashboard Page - React Loading', () => {
  beforeEach(() => {
    // Clear database and setup user
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database');
    
    const testUser = {
      username: 'reactuser',
      email: 'react@example.com',
      password: 'password123',
    };
    
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/register', testUser);
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: testUser.email });
    
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/login',
      body: { email: testUser.email, password: testUser.password }
    }).as('loginResponse');
  });
  
  it('should wait for React to load and then show dashboard', () => {
    cy.get('@loginResponse').then((response) => {
      const token = response.body.data.token;
      
      // Visit the root page first to ensure the React app loads
      cy.visit('/');
      
      // Wait for the React app to load by checking for the root element
      cy.get('#root', { timeout: 20000 }).should('exist');
      
      // Set authentication data
      cy.window().then((win) => {
        win.localStorage.setItem('token', token);
        win.localStorage.setItem('user', JSON.stringify({
          username: 'reactuser',
          email: 'react@example.com'
        }));
      });
      
      // Reload the page to trigger React router with authentication
      cy.reload();
      
      // Wait for React to re-render
      cy.wait(2000);
      
      // Now navigate to dashboard
      cy.visit('/dashboard');
      
      // Wait longer for React to render the dashboard
      cy.get('#root', { timeout: 20000 }).should('exist');
      
      // Wait for any loading states to complete
      cy.wait(3000);
      
      // Now check for dashboard content using more forgiving selectors
      cy.get('body').should('contain.text', 'Dashboard');
      
      // Look for any header elements
      cy.get('h1, h2, h3, h4, h5, h6, .main-header, .header', { timeout: 20000 })
        .should('exist')
        .and('contain.text', 'Dashboard');
      
      // Look for welcome message
      cy.get('body').should('contain.text', 'Welcome');
      cy.get('body').should('contain.text', 'reactuser');
    });
  });
  
  it('should test navigation after React is loaded', () => {
    cy.get('@loginResponse').then((response) => {
      const token = response.body.data.token;
      
      // Setup authentication
      cy.visit('/');
      cy.get('#root').should('exist');
      
      cy.window().then((win) => {
        win.localStorage.setItem('token', token);
        win.localStorage.setItem('user', JSON.stringify({
          username: 'reactuser',
          email: 'react@example.com'
        }));
      });
      
      // Go directly to dashboard
      cy.visit('/dashboard');
      cy.wait(3000);
      
      // Verify we can see dashboard content
      cy.get('body').should('contain.text', 'Dashboard');
      
      // Look for navigation links - the navbar should be rendered
      cy.get('nav, .navbar', { timeout: 15000 }).should('exist');
      
      // Find Profile link and click it
      cy.contains('Profile', { timeout: 15000 }).should('be.visible').click();
      
      // Verify navigation worked
      cy.url().should('include', '/profile');
      cy.wait(2000);
      cy.get('body').should('contain.text', 'Profile');
    });
  });
  
  it('should test logout functionality', () => {
    cy.get('@loginResponse').then((response) => {
      const token = response.body.data.token;
      
      // Setup authentication and navigate to dashboard
      cy.visit('/');
      cy.get('#root').should('exist');
      
      cy.window().then((win) => {
        win.localStorage.setItem('token', token);
        win.localStorage.setItem('user', JSON.stringify({
          username: 'reactuser',
          email: 'react@example.com'
        }));
      });
      
      cy.visit('/dashboard');
      cy.wait(3000);
      
      // Find and click logout
      cy.contains('Logout', { timeout: 15000 }).should('be.visible').click();
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.wait(2000);
      cy.get('body').should('contain.text', 'Login');
      
      // Verify authentication data was cleared
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null;
        expect(win.localStorage.getItem('user')).to.be.null;
      });
    });
  });
});