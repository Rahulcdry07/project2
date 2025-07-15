describe('Forgot Password Flow', () => {
  it('should load the forgot password page', () => {
    cy.visit('/forgot-password');
    cy.get('#root').should('be.visible');
    cy.get('form').should('be.visible'); // Ensure the form is visible
    cy.contains('h2', 'Forgot Your Password?');
  });

  it('should send a reset link for a registered email', () => {
    // Register a user first
    const user = {
      username: 'resetuser',
      email: 'reset@example.com',
      password: 'resetpassword',
    };
    cy.request({ method: 'POST', url: 'http://localhost:3000/api/register', body: user, failOnStatusCode: false });
    cy.request('POST', 'http://localhost:3000/api/test/verify-user', { email: user.email });

    cy.visit('/forgot-password');
    cy.get('#root').should('be.visible');
    cy.get('form').should('be.visible'); // Ensure the form is visible
    cy.get('#email').should('be.visible').type(user.email);
    cy.get('button[type="submit"]').should('be.visible').click();

    cy.contains('If your email address is in our database, you will receive a password reset link.');
  });

  it('should allow a user to reset their password', () => {
    // Register a user first
    const user = {
      username: 'resetuser2',
      email: 'reset2@example.com',
      password: 'oldpassword123',
    };
    cy.request({ method: 'POST', url: 'http://localhost:3000/api/register', body: user, failOnStatusCode: false });
    cy.request('POST', 'http://localhost:3000/api/test/verify-user', { email: user.email });

    // Request a password reset link
    cy.request('POST', 'http://localhost:3000/api/forgot-password', { email: user.email });

    // Get the reset token from the test endpoint
    cy.request('POST', 'http://localhost:3000/api/test/get-reset-token', { email: user.email })
      .then((response) => {
        const resetToken = response.body.resetToken;
        expect(resetToken).to.exist;

        // Visit the reset password page with the token
        cy.visit(`/reset-password?token=${resetToken}`);
        cy.get('#root').should('be.visible');
        cy.get('form').should('be.visible'); // Ensure the form is visible
        cy.contains('h2', 'Reset Your Password');

        // Enter new passwords
        cy.get('#password').should('be.visible').type('newpassword123');
        cy.get('#confirm-password').should('be.visible').type('newpassword123');
        cy.get('button[type="submit"]').should('be.visible').click();

        // Assert successful password reset and redirection to login
        cy.contains('Password has been reset successfully.');
        cy.url().should('include', '/login');
      });
  });
});
