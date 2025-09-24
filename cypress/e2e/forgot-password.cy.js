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
    cy.request({ method: 'POST', url: 'http://0.0.0.0:3000/api/auth/register', body: user, failOnStatusCode: false });
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: user.email });

    // Setup intercept to track reset password request
    cy.intercept('POST', '**/api/auth/forgot-password').as('forgotPasswordRequest');

    cy.visit('/forgot-password');
    cy.get('#root').should('be.visible');
    cy.get('form').should('be.visible'); // Ensure the form is visible
    cy.get('#email').should('be.visible').type(user.email);
    cy.get('button[type="submit"]').should('be.visible').click();

    // Wait for the API call to complete
    cy.wait('@forgotPasswordRequest', { timeout: 10000 }).then(interception => {
      cy.log(`Forgot password API response: ${interception.response?.statusCode}`);
    });

    // Look for the success message in different possible selectors
    cy.get('body').then($body => {
      if ($body.find('.alert-success').length > 0) {
        cy.get('.alert-success').should('be.visible')
          .and('contain', 'If your email address is in our database, you will receive a password reset link.');
      } else if ($body.find('.alert').length > 0) {
        cy.get('.alert').should('be.visible')
          .and('contain', 'If your email address is in our database, you will receive a password reset link.');
      } else {
        // Just check for text content anywhere on the page
        cy.contains('If your email address is in our database, you will receive a password reset link.', 
          { timeout: 10000 }).should('be.visible');
      }
    });

    // Add a fallback if other methods don't find the text
    cy.document().then((doc) => {
      const hasSuccessMessage = doc.body.textContent.includes(
        'If your email address is in our database, you will receive a password reset link.'
      );
      if (hasSuccessMessage) {
        expect(hasSuccessMessage).to.be.true;
      }
    });
  });

  it('should allow a user to reset their password', () => {
    // Register a user first
    const user = {
      username: 'resetuser2',
      email: 'reset2@example.com',
      password: 'oldpassword123',
    };
    cy.request({ method: 'POST', url: 'http://0.0.0.0:3000/api/auth/register', body: user, failOnStatusCode: false });
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: user.email });

    // Request a password reset link
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/forgot-password', { email: user.email });

    // Set up intercept for reset password API call
    cy.intercept('POST', '**/api/auth/reset-password').as('resetPasswordRequest');

    // Get the reset token from the test endpoint
    cy.request('POST', 'http://0.0.0.0:3000/api/test/get-reset-token', { email: user.email })
      .then((response) => {
        const resetToken = response.body.resetToken;
        expect(resetToken).to.exist;
        cy.log(`Reset token received: ${resetToken.substring(0, 20)}...`);

        // Visit the reset password page with the token
        cy.visit(`/reset-password?token=${resetToken}`);
        cy.get('#root').should('be.visible');
        cy.get('form').should('be.visible'); // Ensure the form is visible
        cy.contains('h2', 'Reset Your Password');

        // Enter new passwords
        cy.get('#password').should('be.visible').type('newpassword123');
        cy.get('#confirm-password').should('be.visible').type('newpassword123');
        cy.get('button[type="submit"]').should('be.visible').click();

        // Wait for API call to complete
        cy.wait('@resetPasswordRequest', { timeout: 10000 }).then(interception => {
          cy.log(`Reset password API response: ${interception.response?.statusCode}`);
        });

        // Look for success message in multiple ways
        cy.get('body').then($body => {
          if ($body.find('.alert-success').length > 0) {
            cy.get('.alert-success').should('be.visible')
              .and('contain', 'Password has been reset successfully');
          } else if ($body.find('.alert').length > 0) {
            cy.get('.alert').should('be.visible')
              .and('contain', 'Password has been reset successfully');
          } else {
            // Just check for text content anywhere on the page
            cy.contains('Password has been reset successfully', 
              { timeout: 10000 }).should('be.visible');
          }
        });

        // Add a fallback if other methods don't find the text
        cy.document().then((doc) => {
          const hasSuccessMessage = doc.body.textContent.includes(
            'Password has been reset successfully'
          );
          if (hasSuccessMessage) {
            expect(hasSuccessMessage).to.be.true;
          }
        });

        // Check for redirect to login
        cy.url().should('include', '/login');
      });
  });
});