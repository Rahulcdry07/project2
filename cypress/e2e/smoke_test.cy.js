describe('React App Smoke Test', () => {
  it('should load the React app and display the root element', () => {
    cy.visit('/dashboard-app/build/index.html');
    cy.get('#root').should('be.visible');
  });
});