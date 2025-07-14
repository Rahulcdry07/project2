describe('Forgot Password Flow', () => {
  it('should load the forgot password page', () => {
    cy.visit('/forgot-password.html');
    cy.contains('h2', 'Forgot Your Password?');
  });
});
