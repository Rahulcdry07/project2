describe('Forgot Password Flow', () => {
  beforeEach(() => {
    cy.visit('/forgot-password.html');
    cy.window().then((win) => {
      win.document.dispatchEvent(new Event('DOMContentLoaded', {
        bubbles: true,
        cancelable: true,
      }));
    });
  });

  it('should show a success message on a valid email submission', () => {
    cy.intercept('POST', '/forgot-password', {
      statusCode: 200,
      body: {
        success: true,
        message: 'If your email address is in our database, you will receive a password reset link.',
      },
    }).as('forgotPasswordRequest');

    cy.get('#email').type('test@example.com');
    cy.get('#forgotPasswordForm').submit();

    cy.wait('@forgotPasswordRequest');
    cy.get('#alert-container .message')
      .should('be.visible')
      .and('contain.text', 'If your email address is in our database, you will receive a password reset link.');
  });

  it('should show an error message if the email field is empty', () => {
    cy.get('#forgotPasswordForm').submit();
    cy.get('#alert-container .message').should('be.visible').and('contain.text', 'Please enter your email address.');
  });

  it('should show an error for an invalid email format', () => {
    cy.get('#email').type('invalid-email');
    cy.get('#forgotPasswordForm').submit();
    cy.get('#alert-container .message').should('be.visible').and('contain.text', 'Please enter a valid email address.');
  });
});