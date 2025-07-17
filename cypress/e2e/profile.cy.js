describe('Profile Page', () => {
  beforeEach(() => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    cy.login();
    cy.visit('http://localhost:3001/profile');
    cy.get('#root').should('be.visible');
    cy.wait(2000); // Add a wait to allow React to render
    cy.contains('h2', 'Your Profile');
  });

  it('should load the profile page', () => {
    cy.visit('http://localhost:3001/profile');
    cy.get('h2').should('be.visible');
    cy.get('#root').should('be.visible');
    cy.contains('h2', 'Your Profile');
    cy.get('#username').should('be.visible'); // Ensure elements are visible before typing
    cy.get('#email').should('be.visible');
  });

  it('should update profile information', () => {
    cy.visit('http://localhost:3001/profile');
    cy.get('#root').should('be.visible');
    cy.get('#username').should('be.visible').clear().type('updateduser');
    cy.get('#email').should('be.visible').clear().type('updated@example.com');
    cy.intercept('PUT', '/api/profile').as('updateProfile');
    cy.get('button[type="submit"]').should('be.visible').click();
    cy.wait('@updateProfile');
    cy.contains('Profile updated successfully!');
  });
});