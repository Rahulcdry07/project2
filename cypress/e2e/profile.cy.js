describe('Profile Page', () => {
  beforeEach(() => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    cy.request({ method: 'POST', url: 'http://0.0.0.0:3000/api/auth/register', body: user, failOnStatusCode: false });
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
    cy.contains('h1', 'Dashboard');
  });

  it('should load the profile page', () => {
    cy.visit('/profile');
    cy.get('#root').should('be.visible');
    cy.contains('h2', 'Your Profile');
    cy.get('#username').should('be.visible'); // Ensure elements are visible before typing
    cy.get('#email').should('be.visible');
  });

  it('should update profile information', () => {
    cy.visit('/profile');
    cy.get('#root').should('be.visible');
    cy.get('#username').should('be.visible').clear().type('updateduser');
    cy.get('#email').should('be.visible').clear().type('updated@example.com');
    cy.intercept('PUT', 'http://0.0.0.0:3000/api/profile').as('updateProfile');
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait('@updateProfile');
    cy.contains('Profile updated successfully!');
  });
});