describe('Admin Panel', () => {
  beforeEach(() => {
    // Mock the initial fetch for users and stats
    cy.intercept('GET', '/api/admin/users', {
      statusCode: 200,
      body: {
        success: true,
        users: [
          { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user', is_verified: 1 },
          { id: 2, name: 'Bob', email: 'bob@example.com', role: 'admin', is_verified: 0 },
        ],
      },
    }).as('getUsers');
    cy.visit('/admin.html');
  });

  it('should fetch and display users on load', () => {
    cy.wait('@getUsers');
    cy.get('#user-table-body').children('tr').should('have.length', 2);
    cy.get('#user-table-body').should('contain.text', 'Alice').and('contain.text', 'Bob');
  });

  it('should allow deleting a user', () => {
    cy.intercept('POST', '/api/admin/user/delete', {
      statusCode: 200,
      body: { success: true, message: 'User deleted successfully!' },
    }).as('deleteUser');

    cy.wait('@getUsers');

    // Click the delete button for the second user (Bob)
    cy.get('.delete-user').last().click();

    // The modal should appear
    cy.get('#delete-modal').should('be.visible');
    cy.get('#delete-user-name').should('contain.text', 'Bob');

    // Confirm deletion
    cy.get('#confirm-delete').click();

    cy.wait('@deleteUser');

    // The modal should disappear
    cy.get('#delete-modal').should('not.be.visible');
    cy.get('#alert-container').should('be.visible').and('contain.text', 'User deleted successfully!');
  });
});
