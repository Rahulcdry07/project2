describe('Email Verification Flow', () => {
  beforeEach(() => {
    // Clear database before each test
    cy.request('POST', '/api/test/clear-database');
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display email verification page for unverified user', () => {
    const user = {
      username: 'unverifieduser',
      email: 'unverified@example.com',
      password: 'UnverifiedPass123!',
    };
    cy.request({ method: 'POST', url: '/api/register', body: user, failOnStatusCode: false });

    // Login the unverified user
    cy.request('POST', '/api/login', { email: user.email, password: user.password })
      .then((response) => {
        const token = response.body.token;
        expect(token).to.exist;
        cy.visit('/dashboard', {
          onBeforeLoad: (win) => {
            win.localStorage.setItem('token', token);
          },
        });
      });

    cy.url().should('include', '/verify-email');
    cy.contains('h2', 'Verify Your Email Address');
  });

  it('should successfully verify email with a valid token', () => {
    const user = {
      username: 'verifyuser',
      email: 'verify@example.com',
      password: 'VerifyPass123!',
    };
    cy.request({ method: 'POST', url: '/api/register', body: user, failOnStatusCode: false });

    // Get verification token (via test endpoint)
    cy.request('POST', '/api/test/get-verification-token', { email: user.email })
      .then((response) => {
        const verificationToken = response.body.verificationToken;
        expect(verificationToken).to.exist;

        // Visit verification page with token
        cy.visit(`/verify-email?token=${verificationToken}`);
        cy.url().should('include', '/login');
        cy.contains('Email verified successfully');
      });
  });

  it('should show error for invalid or expired verification token', () => {
    cy.visit('/verify-email?token=invalidtoken');
    cy.url().should('include', '/verify-email');
    cy.contains('Invalid or expired verification link');
  });

  it('should allow requesting a new verification email', () => {
    const user = {
      username: 'resenduser',
      email: 'resend@example.com',
      password: 'ResendPass123!',
    };
    cy.request({ method: 'POST', url: '/api/register', body: user, failOnStatusCode: false });

    // Login the unverified user
    cy.request('POST', '/api/login', { email: user.email, password: user.password })
      .then((response) => {
        const token = response.body.token;
        expect(token).to.exist;
        cy.visit('/dashboard', {
          onBeforeLoad: (win) => {
            win.localStorage.setItem('token', token);
          },
        });
      });

    cy.url().should('include', '/verify-email');
    cy.contains('button', 'Resend Verification Email').click();
    cy.contains('A new verification email has been sent');
  });

  it('should redirect verified user from verification page to dashboard', () => {
    const user = {
      username: 'verifieduser',
      email: 'verified@example.com',
      password: 'VerifiedPass123!',
    };
    cy.request({ method: 'POST', url: '/api/register', body: user, failOnStatusCode: false });
    cy.request('POST', '/api/test/verify-user', { email: user.email }); // Mark as verified

    // Login the verified user
    cy.request('POST', '/api/login', { email: user.email, password: user.password })
      .then((response) => {
        const token = response.body.token;
        expect(token).to.exist;
        cy.visit('/verify-email', {
          onBeforeLoad: (win) => {
            win.localStorage.setItem('token', token);
          },
        });
      });

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  describe('Error Handling', () => {
    it('should handle server errors during verification', () => {
      cy.intercept('POST', '/api/verify-email', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('verificationError');

      cy.visit('/verify-email?token=testtoken');
      cy.wait('@verificationError');
      cy.get('.alert-danger').should('contain', 'Internal server error');
    });

    it('should handle network errors during verification', () => {
      cy.intercept('POST', '/api/verify-email', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit('/verify-email?token=testtoken');
      cy.wait('@networkError');
      cy.get('.alert-danger').should('contain', 'Network error');
    });
  });

  describe('Security', () => {
    it('should not expose sensitive information in error messages', () => {
      cy.visit('/verify-email?token=invalidtoken');
      cy.get('.alert-danger').should('not.contain', 'token');
    });

    it('should prevent brute force attacks on verification', () => {
      // Try to verify with invalid tokens multiple times
      for (let i = 0; i < 6; i++) {
        cy.visit(`/verify-email?token=invalidtoken${i}`);
      }

      // Should show rate limiting error
      cy.get('.alert-danger').should('contain', 'Too many requests');
    });
  });

  describe('Navigation', () => {
    it('should allow navigation back to login page', () => {
      cy.visit('/verify-email');
      cy.get('a[href="/login"]').first().click();
      cy.url().should('include', '/login');
    });

    it('should allow navigation to registration page', () => {
      cy.visit('/verify-email');
      cy.get('a[href="/register"]').first().click();
      cy.url().should('include', '/register');
    });
  });
});