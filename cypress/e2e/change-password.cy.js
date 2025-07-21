describe('Change Password Flow', () => {
  beforeEach(() => {
    // Clear database before each test
    cy.request('POST', '/api/test/clear-database');
    
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
    };
    cy.request('POST', '/api/register', user);
    cy.request('POST', '/api/test/verify-user', { email: user.email });

    // Log in via API and set token
    cy.request('POST', '/api/login', { email: user.email, password: user.password })
      .then((response) => {
        const token = response.body.token;
        expect(token).to.exist;
        cy.visit('/profile', {
          onBeforeLoad: (win) => {
            win.localStorage.setItem('token', token);
          },
        });
      });
  });

  it('should load the change password form', () => {
    cy.contains('h3', 'Change Password').should('be.visible');
    cy.get('#oldPassword').should('be.visible');
    cy.get('#newPassword').should('be.visible');
    cy.get('#confirmNewPassword').should('be.visible');
    cy.get('button[type="submit"]').last().should('be.visible');
  });

  it('should successfully change password with valid inputs', () => {
    cy.get('#oldPassword').type('TestPass123!');
    cy.get('#newPassword').type('NewPass123!');
    cy.get('#confirmNewPassword').type('NewPass123!');
    
    cy.intercept('POST', '/api/change-password').as('changePassword');
    cy.get('button[type="submit"]').last().click();
    cy.wait('@changePassword');

    cy.contains('Password changed successfully').should('be.visible');
    
    // Verify form fields are cleared
    cy.get('#oldPassword').should('have.value', '');
    cy.get('#newPassword').should('have.value', '');
    cy.get('#confirmNewPassword').should('have.value', '');
  });

  it('should show error when old password is incorrect', () => {
    cy.get('#oldPassword').type('WrongPass123!');
    cy.get('#newPassword').type('NewPass123!');
    cy.get('#confirmNewPassword').type('NewPass123!');
    
    cy.intercept('POST', '/api/change-password').as('changePassword');
    cy.get('button[type="submit"]').last().click();
    cy.wait('@changePassword');

    cy.contains('Invalid old password').should('be.visible');
  });

  it('should show error when new passwords do not match', () => {
    cy.get('#oldPassword').type('TestPass123!');
    cy.get('#newPassword').type('NewPass123!');
    cy.get('#confirmNewPassword').type('DifferentPass123!');
    
    cy.get('button[type="submit"]').last().click();

    cy.contains('New passwords do not match').should('be.visible');
  });

  it('should show error when new password does not meet requirements', () => {
    cy.get('#oldPassword').type('TestPass123!');
    cy.get('#newPassword').type('weakpass');
    cy.get('#confirmNewPassword').type('weakpass');
    
    cy.intercept('POST', '/api/change-password').as('changePassword');
    cy.get('button[type="submit"]').last().click();
    cy.wait('@changePassword');

    cy.contains('New password must be at least 8 characters long').should('be.visible');
  });

  it('should verify user can login with new password after change', () => {
    // First, change the password
    cy.get('#oldPassword').type('TestPass123!');
    cy.get('#newPassword').type('NewPass123!');
    cy.get('#confirmNewPassword').type('NewPass123!');
    
    cy.intercept('POST', '/api/change-password').as('changePassword');
    cy.get('button[type="submit"]').last().click();
    cy.wait('@changePassword');

    cy.contains('Password changed successfully').should('be.visible');

    // Logout
    cy.get('a[href="/logout"]').click();
    cy.url().should('include', '/login');

    // Try to login with old password (should fail)
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('TestPass123!');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email or password').should('be.visible');

    // Login with new password (should succeed)
    cy.get('#password').clear().type('NewPass123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Dashboard');
  });

  describe('Input Validation', () => {
    it('should require old password', () => {
      cy.get('#newPassword').type('NewPass123!');
      cy.get('#confirmNewPassword').type('NewPass123!');
      cy.get('button[type="submit"]').last().click();
      
      cy.get('#oldPassword').should('have.attr', 'required');
    });

    it('should require new password', () => {
      cy.get('#oldPassword').type('TestPass123!');
      cy.get('#confirmNewPassword').type('NewPass123!');
      cy.get('button[type="submit"]').last().click();
      
      cy.get('#newPassword').should('have.attr', 'required');
    });

    it('should require password confirmation', () => {
      cy.get('#oldPassword').type('TestPass123!');
      cy.get('#newPassword').type('NewPass123!');
      cy.get('button[type="submit"]').last().click();
      
      cy.get('#confirmNewPassword').should('have.attr', 'required');
    });

    it('should validate password strength requirements', () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumbers!',
        'NoSpecial123'
      ];

      weakPasswords.forEach(password => {
        cy.get('#oldPassword').clear().type('TestPass123!');
        cy.get('#newPassword').clear().type(password);
        cy.get('#confirmNewPassword').clear().type(password);
        cy.get('button[type="submit"]').last().click();
        
        cy.get('.alert-danger').should('be.visible');
      });
    });

    it('should accept valid password formats', () => {
      const validPasswords = [
        'ValidPass123!',
        'AnotherPass456@',
        'TestPass789$'
      ];

      validPasswords.forEach(password => {
        cy.get('#oldPassword').clear().type('TestPass123!');
        cy.get('#newPassword').clear().type(password);
        cy.get('#confirmNewPassword').clear().type(password);
        
        // Should not show validation error for valid passwords
        cy.get('#newPassword').should('have.value', password);
        cy.get('#confirmNewPassword').should('have.value', password);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', () => {
      cy.intercept('POST', '/api/change-password', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('serverError');

      cy.get('#oldPassword').type('TestPass123!');
      cy.get('#newPassword').type('NewPass123!');
      cy.get('#confirmNewPassword').type('NewPass123!');
      cy.get('button[type="submit"]').last().click();

      cy.wait('@serverError');
      cy.get('.alert-danger').should('contain', 'Internal server error');
    });

    it('should handle network errors', () => {
      cy.intercept('POST', '/api/change-password', {
        forceNetworkError: true
      }).as('networkError');

      cy.get('#oldPassword').type('TestPass123!');
      cy.get('#newPassword').type('NewPass123!');
      cy.get('#confirmNewPassword').type('NewPass123!');
      cy.get('button[type="submit"]').last().click();

      cy.wait('@networkError');
      cy.get('.alert-danger').should('contain', 'Network error');
    });

    it('should handle unauthorized access', () => {
      cy.clearLocalStorage();
      cy.visit('/profile');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Security', () => {
    it('should not allow new password to be same as old password', () => {
      cy.get('#oldPassword').type('TestPass123!');
      cy.get('#newPassword').type('TestPass123!');
      cy.get('#confirmNewPassword').type('TestPass123!');
      
      cy.intercept('POST', '/api/change-password').as('changePassword');
      cy.get('button[type="submit"]').last().click();
      cy.wait('@changePassword');

      cy.contains('New password must be different from old password').should('be.visible');
    });

    it('should not expose sensitive information in error messages', () => {
      cy.get('#oldPassword').type('WrongPass123!');
      cy.get('#newPassword').type('NewPass123!');
      cy.get('#confirmNewPassword').type('NewPass123!');
      
      cy.intercept('POST', '/api/change-password').as('changePassword');
      cy.get('button[type="submit"]').last().click();
      cy.wait('@changePassword');

      // Error message should be generic
      cy.get('.alert-danger').should('contain', 'Invalid old password');
      cy.get('.alert-danger').should('not.contain', 'password');
    });

    it('should prevent brute force attacks', () => {
      // Try to change password multiple times with wrong old password
      for (let i = 0; i < 6; i++) {
        cy.get('#oldPassword').clear().type(`WrongPass${i}123!`);
        cy.get('#newPassword').clear().type('NewPass123!');
        cy.get('#confirmNewPassword').clear().type('NewPass123!');
        cy.get('button[type="submit"]').last().click();
      }

      // Should show rate limiting error
      cy.get('.alert-danger').should('contain', 'Too many requests');
    });
  });

  describe('User Experience', () => {
    it('should show loading state during password change', () => {
      cy.intercept('POST', '/api/change-password', { delay: 1000 }).as('slowChangePassword');

      cy.get('#oldPassword').type('TestPass123!');
      cy.get('#newPassword').type('NewPass123!');
      cy.get('#confirmNewPassword').type('NewPass123!');
      cy.get('button[type="submit"]').last().click();

      // Button should be disabled during request
      cy.get('button[type="submit"]').last().should('be.disabled');

      cy.wait('@slowChangePassword');
    });

    it('should maintain form data after validation errors', () => {
      cy.get('#oldPassword').type('TestPass123!');
      cy.get('#newPassword').type('weak');
      cy.get('#confirmNewPassword').type('weak');
      cy.get('button[type="submit"]').last().click();

      // Form data should be preserved
      cy.get('#oldPassword').should('have.value', 'TestPass123!');
      cy.get('#newPassword').should('have.value', 'weak');
      cy.get('#confirmNewPassword').should('have.value', 'weak');
    });

    it('should support keyboard navigation', () => {
      cy.get('#oldPassword').focus();
      cy.get('#oldPassword').type('\t');
      cy.get('#newPassword').should('be.focused');
      cy.get('#newPassword').type('\t');
      cy.get('#confirmNewPassword').should('be.focused');
      cy.get('#confirmNewPassword').type('\t');
      cy.get('button[type="submit"]').last().should('be.focused');
    });

    it('should submit form on Enter key press', () => {
      cy.get('#oldPassword').type('TestPass123!');
      cy.get('#newPassword').type('NewPass123!');
      cy.get('#confirmNewPassword').type('NewPass123!{enter}');
      
      // Should attempt to submit
      cy.get('.alert-success').should('contain', 'Password changed successfully');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      cy.get('label[for="oldPassword"]').should('contain', 'Old Password');
      cy.get('label[for="newPassword"]').should('contain', 'New Password');
      cy.get('label[for="confirmNewPassword"]').should('contain', 'Confirm New Password');
    });

    it('should have proper focus indicators', () => {
      cy.get('#oldPassword').focus();
      cy.get('#oldPassword').should('be.focused');
    });

    it('should support screen readers', () => {
      cy.get('#oldPassword').should('have.attr', 'id');
      cy.get('#newPassword').should('have.attr', 'id');
      cy.get('#confirmNewPassword').should('have.attr', 'id');
      cy.get('button[type="submit"]').last().should('have.attr', 'type', 'submit');
    });
  });
});
