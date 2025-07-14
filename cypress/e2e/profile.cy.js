describe('Profile Page', () => {
  it('should load the profile page', () => {
    cy.visit('/profile.html');
    cy.contains('h2', 'Your Profile');
  });
});