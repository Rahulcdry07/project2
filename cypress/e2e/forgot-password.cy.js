describe('Forgot Password Flow', () => {
  beforeEach(() => {
    // Clear database before each test
    cy.request('POST', '/api/test/clear-database');
    cy.clearLocalStorage();
  });

  it('should load the forgot password page', () => {
    cy.visit('/forgot-password');
    cy.get('form').should('be.visible');
    cy.contains('h2', 'Forgot Your Password?');
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      cy.visit('/forgot-password');
    });

    it('should show error for empty email field', () => {
      cy.get('button[type="submit"]').click();
      cy.get('#email').should('have.attr', 'required');
    });

    it('should show error for invalid email format', () => {
      cy.get('#email').type('invalid-email');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should accept valid email format', () => {
      cy.get('#email').type('valid@example.com');
      cy.get('#email').should('have.value', 'valid@example.com');
    });
  });

  it('should send a reset link for a registered email', () => {
    // Register a user first
    const user = {
      username: 'resetuser',
      email: 'reset@example.com',
      password: 'ResetPass123!',
    };
    cy.request({ method: 'POST', url: '/api/register', body: user, failOnStatusCode: false });
    cy.request('POST', '/api/test/verify-user', { email: user.email });

    cy.visit('/forgot-password');
    cy.get('form').should('be.visible');
    cy.get('#email').should('be.visible').type(user.email);
    cy.intercept('POST', '/api/forgot-password').as('forgotPasswordRequest');
    cy.get('button[type="submit"]').should('be.visible').click();
    
    cy.wait('@forgotPasswordRequest').then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
    });

    cy.contains('If your email address is in our database, you will receive a password reset link.');
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.visit('/forgot-password');
    });

    it('should handle server errors gracefully', () => {
      cy.get('#email').type('error@example.com');

      cy.intercept('POST', '/api/forgot-password', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('serverError');

      cy.get('button[type="submit"]').click();

      cy.wait('@serverError');
      cy.get('.alert-danger').should('contain', 'Internal server error');
    });

    it('should handle network failures', () => {
      cy.get('#email').type('networkfail@example.com');

      cy.intercept('POST', '/api/forgot-password', { forceNetworkError: true }).as('networkError');

      cy.get('button[type="submit"]').click();

      cy.wait('@networkError');
      cy.get('.alert-danger').should('contain', 'Network error');
    });
  });

  it('should allow a user to reset their password', () => {
    // Register a user first
    const user = {
      username: 'resetuser2',
      email: 'reset2@example.com',
      password: 'OldPass123!',
    };
    cy.request({ method: 'POST', url: '/api/register', body: user, failOnStatusCode: false });
    cy.request('POST', '/api/test/verify-user', { email: user.email });

    // Request a password reset link
    cy.request('POST', '/api/forgot-password', { email: user.email });

    // Get the reset token from the test endpoint
    cy.request('POST', '/api/test/get-reset-token', { email: user.email })
      .then((response) => {
        const resetToken = response.body.resetToken;
        expect(resetToken).to.exist;

        // Visit the reset password page with the token
        cy.visit(`/reset-password?token=${resetToken}`);
        cy.get('#password').type('NewPass123!');
        cy.get('#confirmPassword').type('NewPass123!');
        cy.get('button[type="submit"]').click();

        cy.contains('Password has been reset successfully');
      });
  });

  describe('Security', () => {
    it('should not reveal if an email exists in the database', () => {
      cy.visit('/forgot-password');
      cy.get('#email').type('nonexistent@example.com');
      cy.get('button[type="submit"]').click();

      // Should show the same message regardless of email existence
      cy.contains('If your email address is in our database, you will receive a password reset link.');
    });

    it('should prevent brute force attacks', () => {
      // Try to request reset multiple times
      for (let i = 0; i < 6; i++) {
        cy.get('#email').clear().type(`test${i}@example.com`);
        cy.get('button[type="submit"]').click();
      }

      // Should show rate limiting error
      cy.get('.alert-danger').should('contain', 'Too many requests');
    });
  });

  describe('Navigation', () => {
    it('should navigate back to login page', () => {
      cy.visit('/forgot-password');
      cy.get('a[href="/login"]').first().click();
      cy.url().should('include', '/login');
    });
  });
});
