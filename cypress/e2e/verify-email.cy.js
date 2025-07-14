describe('Email Verification', () => {
  it('should show a success message when the token is valid', () => {
    cy.intercept('POST', '/api/verify-email', {
      statusCode: 200,
      body: { message: 'Email verified successfully. You can now log in.' },
    }).as('verifyEmail');

    cy.visit('/verify-email.html?token=test-token');
    cy.wait('@verifyEmail');
    cy.get('#message').should('contain.text', 'Email verified successfully.');
  });

  it('should show an error message when the token is invalid', () => {
    cy.intercept('POST', '/api/verify-email', {
      statusCode: 400,
      body: { error: 'Invalid verification token.' },
    }).as('verifyEmail');

    cy.visit('/verify-email.html?token=invalid-token');
    cy.wait('@verifyEmail');
    cy.get('#message').should('contain.text', 'Error: Invalid verification token.');
  });
});
