describe('Register Flow', () => {
  it('should allow a user to register and redirect to login', () => {
    // Set up intercept before visiting
    cy.intercept('POST', '**/api/auth/register').as('userRegister');
    
    cy.visit('/register');
    cy.get('#root').should('be.visible');
    cy.get('form').should('be.visible'); // Ensure the form is visible
    
    // Add timestamp to ensure unique user
    const timestamp = new Date().getTime();
    const username = `newuser${timestamp}`;
    const email = `new${timestamp}@example.com`;
    
    cy.log(`Registering new user: ${username}, ${email}`);
    
    // Fill in form fields
    cy.get('#username').should('be.visible').clear().type(username);
    cy.get('#email').should('be.visible').clear().type(email);
    cy.get('#password').should('be.visible').clear().type('Password123!');
    cy.get('#confirmPassword').should('be.visible').clear().type('Password123!');
    
    // Check the required terms and conditions checkbox
    cy.get('#termsCheck').should('be.visible').check();
    
    // Submit the form
    cy.get('button[type="submit"]').should('be.visible').click();
    
    // Wait for the API call to complete
    cy.wait('@userRegister', { timeout: 15000 })
      .its('response.statusCode')
      .should('eq', 201);
    
    // Check for success message in the UI
    cy.contains('Registration Successful', { timeout: 10000 }).should('be.visible');
    cy.contains('Your account has been created successfully').should('be.visible');
    
    // Click "Go to Login" button to navigate
    cy.contains('Go to Login').should('be.visible').click();
    
    // Verify redirect to login
    cy.url().should('include', '/login');
  });

  it('should show an error for existing user registration', () => {
    // Use a fixed username/email instead of timestamp-based
    const existingUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
    };
    
    cy.log(`Testing duplicate registration with: ${existingUser.username}, ${existingUser.email}`);
    
    // First, register the user successfully
    cy.visit('/register');
    cy.get('#root').should('be.visible');
    cy.get('form').should('be.visible');
    
    // Fill in the form to create the user first
    cy.get('#username').should('be.visible').clear().type(existingUser.username);
    cy.get('#email').should('be.visible').clear().type(existingUser.email);
    cy.get('#password').should('be.visible').clear().type(existingUser.password);
    cy.get('#confirmPassword').should('be.visible').clear().type(existingUser.password);
    cy.get('#termsCheck').should('be.visible').check();
    
    // Submit first registration
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.contains('Registration Successful', { timeout: 10000 }).should('be.visible');
    
    // Now try to register again with the same details
    cy.visit('/register');
    cy.get('#root').should('be.visible');
    cy.get('form').should('be.visible');
    
    // Set up intercept for the duplicate registration attempt
    cy.intercept('POST', '**/api/auth/register').as('duplicateUserRegister');
    
    // Fill in the form again with the same user details
    cy.get('#username').should('be.visible').clear().type(existingUser.username);
    cy.get('#email').should('be.visible').clear().type(existingUser.email);
    cy.get('#password').should('be.visible').clear().type(existingUser.password);
    cy.get('#confirmPassword').should('be.visible').clear().type(existingUser.password);
    cy.get('#termsCheck').should('be.visible').check();
    
    cy.get('button[type="submit"]').should('be.visible').click();
    
    // Wait for the API call and check it fails with 409 Conflict
    cy.wait('@duplicateUserRegister', { timeout: 15000 }).then(interception => {
      cy.log(`Duplicate registration response: ${interception.response?.statusCode}`);
      expect(interception.response.statusCode).to.be.oneOf([400, 409, 422]);
    });
    
    // Check for error message in the UI - the Alert component should show the error
    cy.get('.alert-danger', { timeout: 10000 }).should('be.visible');
    // Check for various possible error messages
    cy.get('.alert-danger').should(($el) => {
      const text = $el.text();
      expect(text).to.match(/(Username already exists|Email already exists|User already exists|Validation error)/i);
    });
  });
});