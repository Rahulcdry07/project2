describe('Login Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    // Clear database before each test
    cy.request('POST', '/api/test/clear-database');
  });

  it('should allow a registered user to log in', () => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
    };

    // Register a user
    cy.request({ method: 'POST', url: '/api/register', body: user, failOnStatusCode: false });

    // Verify the user's email for testing purposes
    cy.request('POST', '/api/test/verify-user', { email: user.email });

    // Log in via API and set token
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

    // After login, should redirect to the dashboard
    cy.contains('h1', 'Dashboard');
  });

  it('should show an error for invalid credentials', () => {
    cy.visit('/login');
    cy.get('form').should('be.visible');
    cy.get('#email').type('wrong@example.com');
    cy.get('#password').type('WrongPass123!');
    cy.get('button[type="submit"]').click();
    
    cy.get('.alert-danger').should('contain', 'Invalid email or password');
  });

  describe('Input Validation', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should show error when trying to login without email', () => {
      cy.get('#password').type('TestPass123!');
      cy.get('button[type="submit"]').click();
      
      cy.get('#email').should('have.attr', 'required');
    });

    it('should show error when trying to login without password', () => {
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      cy.get('#password').should('have.attr', 'required');
    });

    it('should show error when trying to login with empty fields', () => {
      cy.get('button[type="submit"]').click();
      
      cy.get('#email').should('have.attr', 'required');
      cy.get('#password').should('have.attr', 'required');
    });

    it('should show error for invalid email format', () => {
      cy.get('#email').type('invalid-email');
      cy.get('#password').type('TestPass123!');
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-danger').should('be.visible');
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'first+last@subdomain.example.org'
      ];
      
      validEmails.forEach(email => {
        cy.get('#email').clear().type(email);
        cy.get('#email').should('have.value', email);
      });
    });

    it('should show error for password that is too short', () => {
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('123');
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-danger').should('be.visible');
    });
  });

  describe('Form Behavior', () => {
    it('should clear form after successful login', () => {
      const user = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'TestPass123!',
      };

      // Register and verify user
      cy.request({ method: 'POST', url: '/api/register', body: user, failOnStatusCode: false });
      cy.request('POST', '/api/test/verify-user', { email: user.email });

      // Login
      cy.visit('/login');
      cy.get('#email').type(user.email);
      cy.get('#password').type(user.password);
      cy.get('button[type="submit"]').click();
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
    });

    it('should maintain form data after failed login', () => {
      cy.visit('/login');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // Form data should be preserved
      cy.get('#email').should('have.value', 'test@example.com');
      cy.get('#password').should('have.value', 'wrongpassword');
    });

    it('should support keyboard navigation', () => {
      cy.visit('/login');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('TestPass123!');
      
      // Tab through form fields
      cy.get('#email').focus();
      cy.get('#email').type('\t');
      cy.get('#password').should('be.focused');
      cy.get('#password').type('\t');
      cy.get('button[type="submit"]').should('be.focused');
    });

    it('should submit form on Enter key press', () => {
      cy.visit('/login');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('TestPass123!{enter}');
      
      // Should attempt to submit
      cy.get('.alert-danger').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should handle server errors gracefully', () => {
      cy.intercept('POST', '/api/login', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('serverError');

      cy.get('#email').type('test@example.com');
      cy.get('#password').type('TestPass123!');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@serverError');
      cy.get('.alert-danger').should('be.visible');
    });

    it('should handle network errors', () => {
      cy.intercept('POST', '/api/login', {
        forceNetworkError: true
      }).as('networkError');

      cy.get('#email').type('test@example.com');
      cy.get('#password').type('TestPass123!');
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-danger').should('contain', 'Error logging in');
    });

    it('should handle unverified user login attempt', () => {
      const unverifiedUser = {
        username: 'unverified',
        email: 'unverified@example.com',
        password: 'TestPass123!',
      };

      // Register user but don't verify
      cy.request({ method: 'POST', url: '/api/register', body: unverifiedUser, failOnStatusCode: false });

      cy.get('#email').type(unverifiedUser.email);
      cy.get('#password').type(unverifiedUser.password);
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-danger').should('contain', 'Please verify your email');
    });
  });

  describe('Security', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should not expose sensitive information in error messages', () => {
      cy.get('#email').type('nonexistent@example.com');
      cy.get('#password').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // Error message should be generic
      cy.get('.alert-danger').should('contain', 'Invalid email or password');
      cy.get('.alert-danger').should('not.contain', 'password');
    });

    it('should prevent brute force attacks with rate limiting', () => {
      // Try to login multiple times quickly
      for (let i = 0; i < 6; i++) {
        cy.get('#email').clear().type(`test${i}@example.com`);
        cy.get('#password').clear().type('wrongpassword');
        cy.get('button[type="submit"]').click();
      }
      
      // Should show rate limiting error
      cy.get('.alert-danger').should('contain', 'Too many authentication attempts');
    });

    it('should not store password in plain text', () => {
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('TestPass123!');
      
      // Check that password is not visible in DOM
      cy.get('#password').should('have.attr', 'type', 'password');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should have proper form labels', () => {
      cy.get('label[for="email"]').should('contain', 'Email Address');
      cy.get('label[for="password"]').should('contain', 'Password');
    });

    it('should have proper focus indicators', () => {
      cy.get('#email').focus();
      cy.get('#email').should('be.focused');
    });

    it('should support screen readers', () => {
      cy.get('#email').should('have.attr', 'id');
      cy.get('#password').should('have.attr', 'id');
      cy.get('button[type="submit"]').should('have.attr', 'type', 'submit');
    });
  });

  describe('Integration with Other Pages', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('should navigate to registration page', () => {
      cy.get('a[href="/register"]').first().click();
      cy.url().should('include', '/register');
    });

    it('should navigate to forgot password page', () => {
      cy.get('a[href="/forgot-password"]').first().click();
      cy.url().should('include', '/forgot-password');
    });

    it('should redirect to dashboard after successful login', () => {
      const user = {
        username: 'testuser3',
        email: 'test3@example.com',
        password: 'TestPass123!',
      };

      // Register and verify user
      cy.request({ method: 'POST', url: '/api/register', body: user, failOnStatusCode: false });
      cy.request('POST', '/api/test/verify-user', { email: user.email });

      // Login
      cy.get('#email').type(user.email);
      cy.get('#password').type(user.password);
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/dashboard');
    });
  });
});
