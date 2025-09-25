describe('UI Debug Test', () => {
  it('should debug what is loaded on the page', () => {
    // Visit the dashboard page
    cy.visit('/dashboard', { failOnStatusCode: false });
    
    // Debug the page content
    cy.document().then((doc) => {
      cy.log('Page title:', doc.title);
      cy.log('HTML content preview:');
      cy.log(doc.documentElement.outerHTML.substring(0, 500));
    });
    
    // Check if root element exists
    cy.get('body').should('exist');
    cy.get('#root').should('exist');
    
    // Log what's inside the root element
    cy.get('#root').then(($root) => {
      cy.log('Root element content:');
      cy.log($root.html().substring(0, 500));
    });
    
    // Check current URL
    cy.url().then((url) => {
      cy.log('Current URL:', url);
    });
    
    // Check for any error messages
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      if (bodyText.includes('error') || bodyText.includes('Error')) {
        cy.log('Found error in page:', bodyText);
      }
    });
    
    // Test a simple API call to ensure backend is working
    cy.request('GET', 'http://0.0.0.0:3000/api/health').then((response) => {
      expect(response.status).to.eq(200);
      cy.log('API health check passed');
    });
    
    // Try visiting the root path
    cy.visit('/', { failOnStatusCode: false });
    cy.get('#root').then(($root) => {
      cy.log('Root path content:');
      cy.log($root.html().substring(0, 500));
    });
  });
  
  it('should test authentication flow and page loading', () => {
    // Clear database first
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database');
    
    // Register a user
    const testUser = {
      username: 'debuguser',
      email: 'debug@example.com',
      password: 'password123',
    };
    
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/register', testUser);
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: testUser.email });
    
    // Login via API and get token
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/login',
      body: {
        email: testUser.email,
        password: testUser.password,
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      const token = response.body.data.token;
      
      // Visit root page first
      cy.visit('/');
      
      // Set token in localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('token', token);
        cy.log('Token stored in localStorage');
      });
      
      // Now visit dashboard
      cy.visit('/dashboard');
      
      // Wait a bit for any JavaScript to execute
      cy.wait(2000);
      
      // Debug what's on the page
      cy.get('#root').then(($root) => {
        cy.log('Dashboard page root content:');
        cy.log($root.html());
      });
      
      // Look for any React-specific elements or errors
      cy.get('body').then(($body) => {
        const text = $body.text();
        if (text.includes('Loading')) {
          cy.log('Page is still loading');
        }
        if (text.includes('Cannot')) {
          cy.log('Possible error:', text);
        }
      });
    });
  });
});