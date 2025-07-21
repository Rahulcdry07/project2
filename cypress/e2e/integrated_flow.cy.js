describe('Integrated User Flow', () => {
  const user = {
    username: 'integrateduser',
    email: 'integrated@example.com',
    password: 'IntegratedPass123!',
  };

  beforeEach(() => {
    // Clear database before each test
    cy.request('POST', '/api/test/clear-database');
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should allow a user to register, login, view profile, change password, and logout', () => {
    // 1. Register
    cy.visit('/register');
    cy.get('#username').type(user.username);
    cy.get('#email').type(user.email);
    cy.get('#password').type(user.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');

    // 2. Login
    cy.get('#email').type(user.email);
    cy.get('#password').type(user.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Dashboard');

    // 3. View Profile
    cy.get('a[href="/profile"]').click();
    cy.url().should('include', '/profile');
    cy.contains('h2', 'Your Profile');
    cy.get('#username').should('have.value', user.username);
    cy.get('#email').should('have.value', user.email);

    // 4. Change Password
    const newPassword = 'NewIntegratedPass456!';
    cy.get('#oldPassword').type(user.password);
    cy.get('#newPassword').type(newPassword);
    cy.get('#confirmNewPassword').type(newPassword);
    cy.get('button[type="submit"]').last().click();
    cy.contains('Password changed successfully');

    // 5. Logout
    cy.get('a[href="/logout"]').click();
    cy.url().should('include', '/login');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });

    // 6. Login with new password
    cy.get('#email').type(user.email);
    cy.get('#password').type(newPassword);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Dashboard');
  });

  it('should handle forgot password and reset flow', () => {
    // Register a user for this flow
    const forgotUser = {
      username: 'forgotuser',
      email: 'forgot@example.com',
      password: 'ForgotPass123!',
    };
    cy.request({ method: 'POST', url: '/api/register', body: forgotUser, failOnStatusCode: false });
    cy.request('POST', '/api/test/verify-user', { email: forgotUser.email });

    // 1. Initiate Forgot Password
    cy.visit('/login');
    cy.get('a[href="/forgot-password"]').first().click();
    cy.url().should('include', '/forgot-password');
    cy.get('#email').type(forgotUser.email);
    cy.get('button[type="submit"]').click();
    cy.contains('If your email address is in our database, you will receive a password reset link');

    // 2. Get reset token (via test endpoint)
    cy.request('POST', '/api/test/get-reset-token', { email: forgotUser.email })
      .then((response) => {
        const resetToken = response.body.resetToken;
        expect(resetToken).to.exist;

        // 3. Visit Reset Password page with token
        cy.visit(`/reset-password?token=${resetToken}`);
        cy.url().should('include', '/reset-password');
        cy.contains('h2', 'Reset Your Password');

        // 4. Set new password
        const newForgotPass = 'NewForgotPass456!';
        cy.get('#password').type(newForgotPass);
        cy.get('#confirmPassword').type(newForgotPass);
        cy.get('button[type="submit"]').click();
        cy.contains('Password has been reset successfully');

        // 5. Login with new password
        cy.visit('/login');
        cy.get('#email').type(forgotUser.email);
        cy.get('#password').type(newForgotPass);
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/dashboard');
        cy.contains('h1', 'Dashboard');
      });
  });

  it('should handle email verification flow', () => {
    // 1. Register a new user
    const verifyUser = {
      username: 'verifyuser',
      email: 'verify@example.com',
      password: 'VerifyPass123!',
    };

    cy.visit('/register');
    cy.get('#username').type(verifyUser.username);
    cy.get('#email').type(verifyUser.email);
    cy.get('#password').type(verifyUser.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');

    // 2. Try to login (should fail due to unverified email)
    cy.get('#email').type(verifyUser.email);
    cy.get('#password').type(verifyUser.password);
    cy.get('button[type="submit"]').click();
    cy.contains('Please verify your email');

    // 3. Get verification token and verify email
    cy.request('POST', '/api/test/get-verification-token', { email: verifyUser.email })
      .then((response) => {
        const verificationToken = response.body.verificationToken;
        expect(verificationToken).to.exist;

        // Visit verification page with token
        cy.visit(`/verify-email?token=${verificationToken}`);
        cy.url().should('include', '/login');
        cy.contains('Email verified successfully');
      });

    // 4. Login after verification
    cy.get('#email').type(verifyUser.email);
    cy.get('#password').type(verifyUser.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    cy.contains('h1', 'Dashboard');
  });

  it('should handle admin user management flow', () => {
    // 1. Login as admin
    cy.loginAsAdmin();
    cy.visit('/admin');
    cy.contains('h1', 'Admin Dashboard');

    // 2. Create a regular user
    const regularUser = {
      username: 'regularuser',
      email: 'regular@example.com',
      password: 'RegularPass123!',
    };

    cy.request('POST', '/api/register', regularUser);
    cy.request('POST', '/api/test/verify-user', { email: regularUser.email });

    // 3. Refresh admin page to see new user
    cy.visit('/admin');
    cy.contains('tbody tr', 'regularuser').should('exist');

    // 4. Change user role to admin
    cy.contains('tbody tr', 'regularuser').find('select').select('admin');
    cy.contains('tbody tr', 'regularuser').find('select').should('have.value', 'admin');

    // 5. Change role back to user
    cy.contains('tbody tr', 'regularuser').find('select').select('user');
    cy.contains('tbody tr', 'regularuser').find('select').should('have.value', 'user');

    // 6. Delete the user
    cy.contains('tbody tr', 'regularuser').find('button').click();
    cy.contains('tbody tr', 'regularuser').should('not.exist');
  });

  it('should handle session management and security', () => {
    // 1. Register and login
    cy.visit('/register');
    cy.get('#username').type(user.username);
    cy.get('#email').type(user.email);
    cy.get('#password').type(user.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');

    cy.get('#email').type(user.email);
    cy.get('#password').type(user.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // 2. Verify token is stored
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.exist;
    });

    // 3. Clear token and verify redirect to login
    cy.clearLocalStorage();
    cy.visit('/dashboard');
    cy.url().should('include', '/login');

    // 4. Login again and verify session persistence
    cy.get('#email').type(user.email);
    cy.get('#password').type(user.password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // 5. Navigate to protected routes
    cy.visit('/profile');
    cy.url().should('include', '/profile');
    cy.contains('h2', 'Your Profile');
  });

  it('should handle error scenarios gracefully', () => {
    // 1. Try to access protected route without authentication
    cy.visit('/dashboard');
    cy.url().should('include', '/login');

    // 2. Try to login with invalid credentials
    cy.get('#email').type('invalid@example.com');
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email or password');

    // 3. Try to register with existing email
    cy.visit('/register');
    cy.get('#username').type('newuser');
    cy.get('#email').type(user.email); // Use existing email
    cy.get('#password').type('NewPass123!');
    cy.get('button[type="submit"]').click();
    cy.contains('Email already exists');

    // 4. Try to access admin panel as regular user
    cy.loginAsUser();
    cy.visit('/admin');
    cy.url().should('not.include', '/admin');
  });
});