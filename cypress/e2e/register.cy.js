describe('Register Flow', () => {
  it('should allow a user to register and redirect to login', () => {
    // Set up intercept without waiting
    cy.intercept('POST', '**/api/auth/register').as('userRegister');
    
    cy.visit('/register');
    cy.get('#root').should('be.visible');
    cy.get('form').should('be.visible'); // Ensure the form is visible
    
    // Add timestamp to ensure unique user
    const timestamp = new Date().getTime();
    const username = `newuser${timestamp}`;
    const email = `new${timestamp}@example.com`;
    
    cy.log(`Registering new user: ${username}, ${email}`);
    
    cy.get('#username').should('be.visible').clear().type(username);
    cy.get('#email').should('be.visible').clear().type(email);
    cy.get('#password').should('be.visible').clear().type('newpassword123');
    
    // Use window:confirm/alert listeners before the action that triggers them
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('alertStub');
    });
    
    cy.get('button[type="submit"]').should('be.visible').click();
    
    // Handle API wait differently
    cy.wait('@userRegister', { timeout: 15000 })
      .its('response.statusCode')
      .should('eq', 201)
      .then(() => {
        cy.log('Registration API call successful');
      });
    
    // Check for alert
    cy.get('@alertStub').should('be.calledWithMatch', /Registration successful/);
    
    // Verify redirect to login
    cy.url().should('include', '/login');
  });

  it('should show an error for existing user registration', () => {
    // Register a user first with timestamp to ensure uniqueness
    const timestamp = new Date().getTime();
    const existingUser = {
      username: `existinguser${timestamp}`,
      email: `existing${timestamp}@example.com`,
      password: 'password123',
    };
    
    cy.log(`Creating existing user: ${existingUser.username}, ${existingUser.email}`);
    
    cy.request({ 
      method: 'POST', 
      url: 'http://0.0.0.0:3000/api/auth/register', 
      body: existingUser, 
      failOnStatusCode: false 
    }).then(response => {
      cy.log(`Pre-registration response: ${response.status}`);
      
      // Set up intercept after creating the user
      cy.intercept('POST', '**/api/auth/register').as('existingUserRegister');
      
      cy.visit('/register');
      cy.get('#root').should('be.visible');
      cy.get('form').should('be.visible'); // Ensure the form is visible
      
      // Set up alert stub before form submission
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('alertStub');
      });
      
      // Fill in the form with existing user details
      cy.get('#username').should('be.visible').clear().type(existingUser.username);
      cy.get('#email').should('be.visible').clear().type(existingUser.email);
      cy.get('#password').should('be.visible').clear().type(existingUser.password);
      
      cy.get('button[type="submit"]').should('be.visible').click();
      
      // Wait for the API call but don't check the status since it should fail
      cy.wait('@existingUserRegister', { timeout: 15000 }).then(interception => {
        cy.log(`Registration attempt response: ${interception.response?.statusCode}`);
      });
      
      // Check for alert with error message
      cy.get('@alertStub').should('be.called').then(stub => {
        const errorMessages = [
          'Username already exists',
          'Email already exists',
          'User already exists'
        ];
        
        // Check if any of the expected error messages are contained in the alert
        const alertCalls = stub.getCalls();
        const alertText = alertCalls.length > 0 ? alertCalls[0].args[0] : '';
        
        cy.log(`Alert message: ${alertText}`);
        
        const containsErrorMessage = errorMessages.some(msg => 
          alertText.toLowerCase().includes(msg.toLowerCase())
        );
        
        expect(containsErrorMessage).to.be.true;
      });
    });
  });
});