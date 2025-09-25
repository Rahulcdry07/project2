describe('API Endpoint Health Check', () => {
  it('should return 200 for /api/test/clear-database', () => {
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database').its('status').should('eq', 200);
  });

  it('should return 404 for /api/test/verify-user if user not found', () => {
    cy.request({ method: 'POST', url: 'http://0.0.0.0:3000/api/test/verify-user', body: { email: 'test@example.com' }, failOnStatusCode: false }).its('status').should('eq', 404);
  });

  it('should return 404 for /api/test/set-user-role if user not found', () => {
    cy.request({ method: 'POST', url: 'http://0.0.0.0:3000/api/test/set-user-role', body: { email: 'test@example.com', role: 'user' }, failOnStatusCode: false }).its('status').should('eq', 404);
  });
});