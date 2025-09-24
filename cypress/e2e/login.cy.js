describe('Login Flow', () => {
  it('should allow a registered user to log in', () => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    // Register a user
    cy.request({ method: 'POST', url: 'http://0.0.0.0:3000/api/auth/register', body: user, failOnStatusCode: false });

    // Verify the user's email for testing purposes
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: user.email });

    // Log in via API and set token
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/login', { email: user.email, password: user.password })
      .then((response) => {
        const token = response.body.data.token;
        expect(token).to.exist;
        cy.visit('/dashboard', {
          onBeforeLoad: (win) => {
            win.localStorage.setItem('token', token);
          },
        });
      });

    // After login, should redirect to the dashboard of the React app
    cy.contains('h1', 'Dashboard');
  });

  it('should show an error for invalid credentials', () => {
    cy.visit('/login');
    cy.get('#root').should('be.visible');
    cy.get('form').should('be.visible'); // Ensure the form is visible
    cy.get('#email').should('be.visible').type('wrong@example.com');
    cy.get('#password').should('be.visible').type('wrongpassword');
    cy.intercept('POST', '/api/auth/login').as('invalidLogin');
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait('@invalidLogin');

    cy.on('window:alert', (str) => {
      expect(str).to.contains('Invalid email or password');
    });
  });
});