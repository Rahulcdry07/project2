describe('Register Flow', () => {
  it('should load the register page', () => {
    cy.visit('/register.html');
    cy.contains('h2', 'Create Your Account');
  });
});