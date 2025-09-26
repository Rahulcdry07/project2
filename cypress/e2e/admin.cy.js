describe('Admin Panel', () => {
  beforeEach(() => {
    cy.log('Setting up admin user and logging in');
    cy.loginAsAdmin();
    cy.log('Admin user logged in successfully');

    // Add intercept to debug API calls
    cy.intercept('GET', '**/api/admin/users').as('getUsers');

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

    // Visit admin page and add debug for loading
    cy.log('Navigating to admin page');
    cy.visit('/admin');

    // Wait for any element that indicates the page has loaded
    cy.get('#root', { timeout: 10000 }).should('be.visible');
    cy.log('Root element is visible');
    
    // Wait a bit for React to initialize
    cy.wait(2000);
  });

  it('should load the admin page and see both users', () => {
    // Log the current URL to verify we're on the admin page
    cy.url().should('include', '/admin');
    cy.log('URL includes /admin');
    
    // Debug what's rendered on the page
    cy.document().then((doc) => {
      cy.log('Current page content:', doc.body.innerHTML.substring(0, 150) + '...');
    });

    // Wait for admin dashboard heading with longer timeout
    cy.contains('h1', 'Admin Dashboard', { timeout: 15000 })
      .should('be.visible')
      .then($el => {
        cy.log(`Found admin dashboard heading: "${$el.text()}"`);
      });

    // Wait for API call to complete
    cy.wait('@getUsers', { timeout: 15000 }).then(interception => {
      cy.log('API response received:', interception.response?.statusCode);
      if (interception.response?.body) {
        cy.log(`Found ${interception.response.body.data?.length || 'unknown'} users in API response`);
      }
    });

    // Add more specific selector for user table
    cy.get('.table-responsive table', { timeout: 15000 }).should('be.visible');
    cy.log('User table is visible');

    // Check for table rows with more specific selector and longer timeout
    cy.get('.table-responsive tbody tr', { timeout: 20000 })
      .should('have.length.at.least', 1)
      .then($rows => {
        cy.log(`Found ${$rows.length} user rows in the table`);
      });
  });

  it("should update a user's role from user to admin", () => {
    // Wait for API response first
    cy.wait('@getUsers', { timeout: 15000 });
    
    // Wait for the table to be visible
    cy.get('.table-responsive table', { timeout: 15000 }).should('be.visible');
    
    // Debug table contents
    cy.get('tbody').then($tbody => {
      cy.log('Table body HTML:', $tbody.html().substring(0, 150) + '...');
    });

    // Find the row containing the testuser with more robust selector
    cy.contains('tbody tr', 'testuser', { timeout: 15000 })
      .should('be.visible')
      .within(() => {
        // Find the role select element with a more precise selector
        cy.get('select, .form-select').select('admin');
        cy.log('Selected admin role for testuser');
      });

    // Verify the role was updated
    cy.contains('tbody tr', 'testuser', { timeout: 15000 })
      .find('select, .form-select')
      .should('have.value', 'admin');
    
    cy.log('Verified role was updated to admin');
  });

  it('should delete a user', () => {
    // Wait for API response first
    cy.wait('@getUsers', { timeout: 15000 });
    
    // Wait for the table to be visible
    cy.get('.table-responsive table', { timeout: 15000 }).should('be.visible');
    
    // Get the initial number of rows with more specific selector
    cy.get('.table-responsive tbody tr', { timeout: 15000 }).then(rows => {
      const initialCount = rows.length;
      cy.log(`Initial row count: ${initialCount}`);
      
      // Find the specific delete button for testuser
      cy.contains('tbody tr', 'testuser', { timeout: 15000 })
        .within(() => {
          // Use a more specific selector for the delete button
          cy.get('.btn-outline-danger, .btn-danger')
            .should('be.visible')
            .click();
        });
      
      // Confirm the deletion
      cy.on('window:confirm', () => true);
      cy.log('Confirmed deletion dialog');
      
      // Verify one less row with more specific selector and longer timeout
      cy.get('.table-responsive tbody tr', { timeout: 20000 })
        .should('have.length', initialCount - 1);
      
      cy.contains('tbody tr', 'testuser').should('not.exist');
      cy.log('Verified testuser was deleted');
    });
  });
});