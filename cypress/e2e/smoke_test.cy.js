describe('React App Smoke Test', () => {
  it('should load the React app and display the root element', () => {
    cy.visit('/'); // Visit the root URL, which should serve the React app
    cy.get('#root').should('be.visible');
    cy.title().should('eq', 'React App'); // Verify the page title
    cy.contains('Register').should('be.visible'); // Check for Register link
    cy.contains('Login').should('be.visible'); // Check for Login link
  });
});