describe('Register Flow', () => {
  it('should allow a user to register and redirect to login', () => {
    cy.visit('/register');
    cy.get('#root').should('be.visible');
    cy.get('form').should('be.visible'); // Ensure the form is visible
    cy.get('#username').should('be.visible').type('newuser');
    cy.get('#email').should('be.visible').type('new@example.com');
    cy.get('#password').should('be.visible').type('newpassword123');
    cy.intercept('POST', 'http://localhost:3000/api/register').as('userRegister');
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait('@userRegister');

    cy.on('window:alert', (str) => {
      expect(str).to.contains('Registration successful');
    });

    cy.url().should('include', '/login');
  });

  it('should show an error for existing user registration', () => {
    // Register a user first
    const existingUser = {
      username: 'existinguser',
      email: 'existing@example.com',
      password: 'password123',
    };
    cy.request({ method: 'POST', url: 'http://localhost:3000/api/register', body: existingUser, failOnStatusCode: false });

    cy.visit('/register');
    cy.get('#root').should('be.visible');
    cy.get('form').should('be.visible'); // Ensure the form is visible
    cy.get('#username').should('be.visible').type(existingUser.username);
    cy.get('#email').should('be.visible').type(existingUser.email);
    cy.get('#password').should('be.visible').type(existingUser.password);
    cy.intercept('POST', 'http://localhost:3000/api/register').as('existingUserRegister');
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait('@existingUserRegister');

    cy.on('window:alert', (str) => {
      expect(str).to.contains('Username already exists.');
    });
  });
});