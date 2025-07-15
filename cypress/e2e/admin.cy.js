describe('Admin Panel', () => {
  beforeEach(() => {
    cy.loginAsAdmin();

    const regularUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    cy.request('POST', 'http://localhost:3000/api/register', regularUser);
    cy.request('POST', 'http://localhost:3000/api/test/verify-user', { email: regularUser.email });

    cy.intercept('GET', '/api/admin/users').as('getUsers');
    cy.visit('/admin');
    cy.wait('@getUsers');
  });

  it('should load the admin page and see both users', () => {
    cy.get('h1').should('contain', 'Admin Dashboard');
    cy.get('tbody tr').should('have.length', 2);
  });

  it("should update a user's role from user to admin", () => {
    cy.intercept('PUT', '/api/admin/users/*/role').as('updateRole');
    cy.contains('tbody tr', 'testuser').find('.form-select').select('admin');
    cy.wait('@updateRole').its('response.statusCode').should('eq', 200);
    cy.contains('tbody tr', 'testuser').find('.form-select').should('have.value', 'admin');
  });

  it('should delete a user', () => {
    cy.intercept('DELETE', '/api/admin/users/*').as('deleteUser');
    cy.contains('tbody tr', 'testuser').find('.btn-danger').click();
    cy.on('window:confirm', () => true);
    cy.wait('@deleteUser').its('response.statusCode').should('eq', 200);
    cy.get('tbody tr').should('have.length', 1);
    cy.contains('tbody tr', 'testuser').should('not.exist');
  });
});