beforeEach(() => {
  cy.log('Clearing database before test...');
  cy.request('POST', 'http://localhost:3000/api/test/clear-database');
  cy.wait(500); // Add a small wait to ensure database is cleared
});

Cypress.Commands.add('loginAsAdmin', () => {
  const adminUser = {
    username: 'adminuser',
    email: 'admin@example.com',
    password: 'adminpassword',
  };
  cy.request({ method: 'POST', url: 'http://localhost:3000/api/register', body: adminUser, failOnStatusCode: false });
  cy.request('POST', 'http://localhost:3000/api/test/verify-user', { email: adminUser.email });
  cy.request('POST', 'http://localhost:3000/api/test/set-user-role', { email: adminUser.email, role: 'admin' });

  cy.request('POST', 'http://localhost:3000/api/login', { email: adminUser.email, password: adminUser.password })
    .then((response) => {
      const token = response.body.token;
      expect(token).to.exist;
      cy.window().then((win) => {
        win.localStorage.setItem('token', token);
      });
    });
});