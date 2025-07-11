describe('Profile Page', () => {
  beforeEach(() => {
    // Set user info in localStorage to simulate a logged-in user
    cy.window().then((win) => {
      win.localStorage.setItem('user_id', '1');
      win.localStorage.setItem('user_name', 'Test User');
      win.localStorage.setItem('user_role', 'user');
    });

    // Mock the initial profile data fetch
    cy.intercept('GET', '/api/profile', {
      statusCode: 200,
      body: {
        success: true,
        user: {
          name: 'Test User',
          email: 'test@example.com',
          created_at: '2023-01-01T12:00:00Z',
          is_verified: 1,
        },
      },
    }).as('getProfile');

    // Mock CSRF token
    cy.intercept('GET', '/csrf_token', {
      statusCode: 200,
      body: { token: 'test-csrf-token' },
    }).as('getCsrfToken');

    cy.visit('/profile.html');
  });

  it('should fetch and display the user profile on load', () => {
    cy.wait('@getProfile');
    cy.get('#name').should('have.value', 'Test User');
    cy.get('#email').should('have.value', 'test@example.com');
    cy.get('#is_verified').should('have.value', 'Yes');
  });

  it('should allow a user to update their profile', () => {
    cy.intercept('POST', '/api/profile_update', {
      statusCode: 200,
      body: { success: true, message: 'Profile updated successfully!' },
    }).as('updateProfile');

    cy.get('#name').clear().type('Updated Name');
    cy.get('#profileForm').submit();

    cy.wait('@updateProfile');
    cy.get('#alert-container-profile').should('be.visible').and('contain.text', 'Profile updated successfully!');

    // Check that localStorage was updated
    cy.window().its('localStorage.user_name').should('eq', 'Updated Name');
  });

  it('should allow a user to change their password', () => {
    cy.intercept('POST', '/api/change_password', {
      statusCode: 200,
      body: { success: true, message: 'Password changed successfully!' },
    }).as('changePassword');

    cy.get('#current_password').type('old_password');
    cy.get('#new_password').type('new_password123!');
    cy.get('#confirm_new_password').type('new_password123!');
    cy.get('#changePasswordForm').submit();

    cy.wait('@changePassword');
    cy.get('#alert-container-password').should('be.visible').and('contain.text', 'Password changed successfully!');
  });

  it('should allow a user to delete their account and be redirected', () => {
    cy.intercept('POST', '/api/profile_delete', {
      statusCode: 200,
      body: { success: true, message: 'Account deleted successfully.' },
    }).as('deleteAccount');

    // Cypress automatically handles confirm dialogs
    cy.get('#delete-account-button').click();

    cy.wait('@deleteAccount');

    // Check for redirection
    cy.url().should('include', 'login.html');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('user_id')).to.be.null;
    });
  });
});
