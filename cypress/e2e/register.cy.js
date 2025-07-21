describe('Register Flow', () => {
  beforeEach(() => {
    // Clear database before each test
    cy.request('POST', '/api/test/clear-database');
    cy.visit('/register');
  });

  describe('Page Load and UI Elements', () => {
    it('should load the registration page correctly', () => {
      cy.title().should('include', 'React App');
      cy.get('h2').should('contain', 'Create Your Account');
    });

    it('should display all required form fields', () => {
      cy.get('#username').should('be.visible');
      cy.get('#email').should('be.visible');
      cy.get('#password').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should have proper form field attributes', () => {
      cy.get('#username').should('have.attr', 'type', 'text');
      cy.get('#email').should('have.attr', 'type', 'email');
      cy.get('#password').should('have.attr', 'type', 'password');
      cy.get('button[type="submit"]').should('contain', 'Register');
    });

    it('should have navigation links', () => {
      cy.get('a[href="/login"]').should('contain', 'Login');
    });
  });

  describe('Input Validation - Username', () => {
    it('should reject empty username', () => {
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      cy.get('#username').should('have.attr', 'required');
    });

    it('should reject username with special characters', () => {
      cy.get('#username').type('user@#$%');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      // Check for validation error message
      cy.get('.alert-danger').should('be.visible');
    });

    it('should reject username that is too short', () => {
      cy.get('#username').type('ab');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should reject username that is too long', () => {
      cy.get('#username').type('a'.repeat(51)); // Assuming max length is 50
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should accept valid username', () => {
      cy.get('#username').type('validuser123');
      cy.get('#username').should('have.value', 'validuser123');
    });
  });

  describe('Input Validation - Email', () => {
    it('should reject empty email', () => {
      cy.get('#username').type('testuser');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      cy.get('#email').should('have.attr', 'required');
    });

    it('should reject invalid email format - no @ symbol', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('invalidemail.com');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should reject invalid email format - no domain', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('test@');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should reject invalid email format - no local part', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('@example.com');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should reject email with spaces', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('test @example.com');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        cy.get('#email').clear().type(email);
        cy.get('#email').should('have.value', email);
      });
    });
  });

  describe('Input Validation - Password', () => {
    it('should reject empty password', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('button[type="submit"]').click();
      cy.get('#password').should('have.attr', 'required');
    });

    it('should reject password that is too short', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('short');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should reject password without uppercase letter', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('validpass123!');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should reject password without lowercase letter', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('VALIDPASS123!');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should reject password without number', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('ValidPass!');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should reject password without special character', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('ValidPass123');
      cy.get('button[type="submit"]').click();
      cy.get('.alert-danger').should('be.visible');
    });

    it('should accept valid password', () => {
      cy.get('#password').type('ValidPass123!');
      cy.get('#password').should('have.value', 'ValidPass123!');
    });
  });

  describe('Form Submission - Success Cases', () => {
    it('should successfully register a new user and redirect to login', () => {
      const uniqueUser = {
        username: `testuser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'ValidPass123!'
      };

      cy.get('#username').type(uniqueUser.username);
      cy.get('#email').type(uniqueUser.email);
      cy.get('#password').type(uniqueUser.password);
      cy.get('button[type="submit"]').click();
      
      // Should show success message and redirect
      cy.url().should('include', '/login');
    });

    it('should show loading state during registration', () => {
      const uniqueUser = {
        username: `testuser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'ValidPass123!'
      };

      cy.get('#username').type(uniqueUser.username);
      cy.get('#email').type(uniqueUser.email);
      cy.get('#password').type(uniqueUser.password);
      cy.get('button[type="submit"]').click();
      
      // Button should be disabled during submission
      cy.get('button[type="submit"]').should('be.disabled');
    });
  });

  describe('Form Submission - Error Cases', () => {
    it('should show error for existing username', () => {
      // First register a user
      const existingUser = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'ValidPass123!'
      };

      cy.request({
        method: 'POST',
        url: '/api/register',
        body: existingUser,
        failOnStatusCode: false
      });

      // Try to register with same username
      cy.get('#username').type(existingUser.username);
      cy.get('#email').type('different@example.com');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-danger').should('contain', 'Username already exists');
    });

    it('should show error for existing email', () => {
      // First register a user
      const existingUser = {
        username: 'existinguser2',
        email: 'existing2@example.com',
        password: 'ValidPass123!'
      };

      cy.request({
        method: 'POST',
        url: '/api/register',
        body: existingUser,
        failOnStatusCode: false
      });

      // Try to register with same email
      cy.get('#username').type('differentuser');
      cy.get('#email').type(existingUser.email);
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-danger').should('contain', 'Email already exists');
    });

    it('should handle server errors gracefully', () => {
      // Intercept the API call and return an error
      cy.intercept('POST', '/api/register', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('registerError');

      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@registerError');
      cy.get('.alert-danger').should('be.visible');
    });

    it('should handle network errors', () => {
      // Intercept the API call and force a network error
      cy.intercept('POST', '/api/register', {
        forceNetworkError: true
      }).as('networkError');

      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      
      cy.get('.alert-danger').should('contain', 'Error registering');
    });
  });

  describe('Form Behavior and UX', () => {
    it('should clear form after successful registration', () => {
      const uniqueUser = {
        username: `testuser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'ValidPass123!'
      };

      cy.get('#username').type(uniqueUser.username);
      cy.get('#email').type(uniqueUser.email);
      cy.get('#password').type(uniqueUser.password);
      cy.get('button[type="submit"]').click();
      
      // Should redirect to login page
      cy.url().should('include', '/login');
    });

    it('should maintain form data after validation errors', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('invalid-email');
      cy.get('#password').type('ValidPass123!');
      cy.get('button[type="submit"]').click();
      
      // Form data should be preserved
      cy.get('#username').should('have.value', 'testuser');
      cy.get('#email').should('have.value', 'invalid-email');
      cy.get('#password').should('have.value', 'ValidPass123!');
    });

    it('should support keyboard navigation', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('ValidPass123!');
      
      // Tab through form fields
      cy.get('#username').focus();
      cy.get('#username').type('\t');
      cy.get('#email').should('be.focused');
      cy.get('#email').type('\t');
      cy.get('#password').should('be.focused');
      cy.get('#password').type('\t');
      cy.get('button[type="submit"]').should('be.focused');
    });

    it('should submit form on Enter key press', () => {
      const uniqueUser = {
        username: `testuser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'ValidPass123!'
      };

      cy.get('#username').type(uniqueUser.username);
      cy.get('#email').type(uniqueUser.email);
      cy.get('#password').type(uniqueUser.password + '{enter}');
      
      // Should attempt to submit
      cy.url().should('include', '/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      cy.get('#username').should('have.attr', 'id');
      cy.get('#email').should('have.attr', 'id');
      cy.get('#password').should('have.attr', 'id');
    });

    it('should have proper form labels', () => {
      cy.get('label[for="username"]').should('contain', 'Username');
      cy.get('label[for="email"]').should('contain', 'Email Address');
      cy.get('label[for="password"]').should('contain', 'Password');
    });

    it('should have proper focus indicators', () => {
      cy.get('#username').focus();
      cy.get('#username').should('be.focused');
    });
  });

  describe('Integration with Other Pages', () => {
    it('should navigate to login page when login link is clicked', () => {
      cy.get('a[href="/login"]').first().click();
      cy.url().should('include', '/login');
    });

    it('should redirect to login after successful registration', () => {
      const uniqueUser = {
        username: `testuser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'ValidPass123!'
      };

      cy.get('#username').type(uniqueUser.username);
      cy.get('#email').type(uniqueUser.email);
      cy.get('#password').type(uniqueUser.password);
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/login');
    });

    it('should maintain registration data in session/local storage if needed', () => {
      cy.get('#username').type('testuser');
      cy.get('#email').type('test@example.com');
      cy.get('#password').type('ValidPass123!');
      
      // Data should be in form fields
      cy.get('#username').should('have.value', 'testuser');
      cy.get('#email').should('have.value', 'test@example.com');
      cy.get('#password').should('have.value', 'ValidPass123!');
    });
  });
});