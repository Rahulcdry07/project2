describe('Email Verification', () => {
  it('should show a success message when the token is valid', () => {
    cy.intercept('POST', 'http://0.0.0.0:3000/api/verify-email', (req) => {
      req.reply({
        statusCode: 200,
        body: { message: 'Email verified successfully. You can now log in.' },
      });
    }).as('verifyEmail');

    cy.log('Intercepting verify-email request for success:', 'test-token');

    cy.visit('/verify-email?token=test-token');
    cy.get('#root').should('be.visible');
    cy.get('.card').should('be.visible'); // Ensure the card is visible
    cy.wait('@verifyEmail');
    cy.contains('Email verified successfully.');
    cy.url().should('include', '/login');
  });

  it('should show an error message when the token is invalid', () => {
    cy.intercept('POST', 'http://0.0.0.0:3000/api/verify-email', (req) => {
      req.reply({
        statusCode: 400,
        body: { error: 'Invalid verification token.' },
      });
    }).as('verifyEmail');

    cy.log('Intercepting verify-email request for error:', 'invalid-token');

    cy.visit('/verify-email?token=invalid-token');
    cy.get('#root').should('be.visible');
    cy.get('.card').should('be.visible'); // Ensure the card is visible
    cy.wait('@verifyEmail');
    cy.contains('Error: Invalid verification token.');
  });
});
