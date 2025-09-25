describe('Admin Panel', () => {
  beforeEach(() => {
    // Clear database first
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database');
    
    cy.log('Setting up admin user and logging in');
    cy.loginAsAdmin();
    cy.log('Admin user logged in successfully');

    // Create a regular user for testing
    const regularUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    
    cy.log('Creating regular test user');
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/register', regularUser);
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: regularUser.email });
    cy.log('Regular test user created and verified');
  });

  it('should load the admin page and see both users', () => {
    // Add intercept to debug API calls
    cy.intercept('GET', '**/api/admin/users').as('getUsers');

    // Visit admin page
    cy.log('Navigating to admin page');
    cy.visit('/admin');
    
    // Wait for React to load and process authentication
    cy.wait(2000);

    // Log the current URL to verify we're on the admin page
    cy.url().should('include', '/admin');
    cy.log('URL includes /admin');

    // Wait for admin dashboard content
    cy.get('body').should('contain.text', 'Admin', { timeout: 15000 });
    cy.log('Found admin content');

    // Wait for API call to complete
    cy.wait('@getUsers', { timeout: 15000 }).then(interception => {
      cy.log('API response received:', interception.response?.statusCode);
      if (interception.response?.body) {
        cy.log(`Found ${interception.response.body.length} users in API response`);
      }
    });

    // Look for table or user list content
    cy.get('body').should('contain.text', 'testuser', { timeout: 15000 });
    cy.get('body').should('contain.text', 'adminuser', { timeout: 15000 });
    cy.log('Found both users in the page');
  });

  it('should show user management functionality', () => {
    // Add intercept
    cy.intercept('GET', '**/api/admin/users').as('getUsers');

    // Visit admin page
    cy.visit('/admin');
    cy.wait(2000);
    
    // Wait for API response
    cy.wait('@getUsers', { timeout: 15000 });
    
    // Verify we can see user management content
    cy.get('body').should('contain.text', 'Admin', { timeout: 15000 });
    cy.get('body').should('contain.text', 'testuser', { timeout: 15000 });
    
    // Look for any interactive elements (tables, buttons, forms)
    cy.get('table, .table, form, button, select', { timeout: 15000 }).should('exist');
    
    cy.log('Admin page loaded with user management interface');
  });

  it('should handle admin authentication properly', () => {
    // Visit admin page
    cy.visit('/admin');
    cy.wait(2000);
    
    // Should not redirect to login (since we're admin)
    cy.url().should('include', '/admin');
    
    // Should show admin content
    cy.get('body').should('contain.text', 'Admin', { timeout: 15000 });
    
    // Verify admin navigation is available
    cy.get('nav, .navbar', { timeout: 10000 }).should('exist');
    cy.contains('Admin', { timeout: 10000 }).should('be.visible');
    
    cy.log('Admin authentication and access verified');
  });
});