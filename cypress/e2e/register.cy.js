describe('Register Flow', () => {
  beforeEach(() => {
    cy.visit('/register.html');

    // Mock CSRF token endpoint
    cy.intercept('GET', '/csrf_token', {
      statusCode: 200,
      body: { token: 'test-csrf-token' },
    }).as('getCsrfToken');
  });

  it('should allow a user to register successfully', () => {
    // Mock the register API endpoint for a successful registration
    cy.intercept('POST', '/register', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Registration successful! Please check your email for verification.',
      },
    }).as('registerRequest');

    // Fill out the form
    cy.get('#name').type('Test User');
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('Password123!');
    cy.get('#confirm_password').type('Password123!');

    // Submit the form
    cy.get('#registerForm').submit();

    // Wait for the request and assert the success message
    cy.wait('@registerRequest');
    cy.get('.message').should('be.visible').and('contain.text', 'Registration successful!');
  });

  it('should show an error message if the email is already registered', () => {
    // Mock the register API for a failed registration (email exists)
    cy.intercept('POST', '/register', {
      statusCode: 400,
      body: {
        success: false,
        message: 'Email already registered.',
      },
    }).as('registerRequest');

    cy.get('#name').type('Test User');
    cy.get('#email').type('existing@example.com');
    cy.get('#password').type('Password123!');
    cy.get('#confirm_password').type('Password123!');
    cy.get('#registerForm').submit();

    cy.wait('@registerRequest');
    cy.get('.message').should('be.visible').and('contain.text', 'Email already registered.');
  });

  it('should show an error if passwords do not match', () => {
    cy.get('#name').type('Test User');
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('Password123!');
    cy.get('#confirm_password').type('WrongPassword123!');
    cy.get('#registerForm').submit();

    // This is a client-side validation, so no network request is made
    cy.get('.message').should('be.visible').and('contain.text', 'Passwords do not match.');
  });
});
