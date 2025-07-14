describe('Navigation Bar', () => {
  it('should load the dashboard page', () => {
    cy.visit('/dashboard.html');
    cy.contains('h1', 'Dashboard');
  });
});