describe('Admin Panel', () => {
  it('should load the admin page', () => {
    cy.visit('/admin.html');
    cy.contains('h1', 'Admin Dashboard');
  });
});