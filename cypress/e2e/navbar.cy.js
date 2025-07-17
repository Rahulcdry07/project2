describe('Navbar Visibility', () => {
  it('should not display the navbar on the login page', () => {
    cy.visit('/');
    cy.get('.navbar').should('not.exist');
  });

  it('should not display the navbar on the register page', () => {
    cy.visit('/register');
    cy.get('.navbar').should('not.exist');
  });

  it('should display the navbar on the dashboard page after login', () => {
    // Assuming a successful login redirects to dashboard
    cy.login(); // Use the custom login command if available, otherwise perform login steps
    cy.visit('/dashboard');
    cy.get('.navbar').should('be.visible');
  });
});