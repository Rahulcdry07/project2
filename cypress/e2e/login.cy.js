describe('Login Flow', () => {
  beforeEach(() => {
    // Serve the project's root directory.
    // This assumes you have a simple server to run your HTML files.
    // If you don't, you can use `npx http-server -p 8000` from your project root.
    cy.visit('/login.html');

    // Mock the CSRF token endpoint
    cy.intercept('GET', '/csrf_token', {
      statusCode: 200,
      body: { token: 'test-csrf-token' },
    }).as('getCsrfToken');

    // Mock the login API endpoint for a successful login
    cy.intercept('POST', '/login', {
      statusCode: 200,
      body: {
        success: true,
        user: {
          name: 'Test User',
          role: 'user',
        },
      },
    }).as('loginRequest');
  });

  it('should allow a user to log in successfully and redirect to dashboard', () => {
    // Fill out the form
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('password123');

    // Submit the form
    cy.get('#loginForm').submit();

    // Wait for the login request to be made
    cy.wait('@loginRequest');

    // After successful login, the page should redirect to the dashboard
    // Check if the URL includes 'dashboard.html'
    cy.url().should('include', 'dashboard.html');

    // You can also check if localStorage was updated
    cy.window().its('localStorage.user_name').should('eq', 'Test User');
  });

  it('should show an error message on failed login', () => {
    // Override the login interceptor for a failed login
    cy.intercept('POST', '/login', {
      statusCode: 401,
      body: {
        success: false,
        message: 'Invalid credentials.',
      },
    }).as('failedLoginRequest');

    cy.get('#email').type('wrong@example.com');
    cy.get('#password').type('wrongpassword');
    cy.get('#loginForm').submit();

    cy.wait('@failedLoginRequest');

    // Check for the error message
    cy.get('.message').should('be.visible').and('contain.text', 'Invalid credentials.');
  });
});
