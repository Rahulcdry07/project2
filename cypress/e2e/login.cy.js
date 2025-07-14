describe('Login Flow', () => {
  it('should allow a registered user to log in', () => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    // Register a user
    cy.request('POST', '/api/register', user);

    // Verify the user's email for testing purposes
    cy.request('POST', '/api/test/verify-user', { email: user.email });

    // Visit the login page
    cy.visit('/login.html');

    // Visit the login page
    cy.visit('/login.html');

    // Log in with the same credentials by typing into the form
    cy.get('#email').type(user.email);
    cy.get('#password').type(user.password);
    cy.get('button[type="submit"]').click();

    // After login, should redirect to the dashboard
    cy.url().should('include', '/dashboard.html');
    cy.contains('h1', 'Dashboard');
  });

  it('should show an error for invalid credentials', () => {
    cy.visit('/login.html');
    cy.get('#email').type('wrong@example.com');
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should display an error message
    cy.on('window:alert', (str) => {
      expect(str).to.contains('Invalid email or password');
    });
  });
});