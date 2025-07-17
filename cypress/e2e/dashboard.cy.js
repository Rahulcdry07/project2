describe('Dashboard Page', () => {
  beforeEach(() => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    cy.login();
    cy.visit('http://localhost:3001');
    cy.get('#root').should('be.visible');
    cy.wait(2000); // Add a small wait to ensure database is cleared
    cy.contains('h1', 'Dashboard');
  });

  it('should load the dashboard page and display username', () => {
    cy.contains('h1', 'Dashboard');
    cy.contains('p', 'Welcome to your dashboard, testuser!');
  });

  

  it('should navigate to the profile page', () => {
    cy.visit('/profile');
    cy.get('#root').should('be.visible');
    cy.contains('h2', 'Your Profile');
  });

  it('should logout successfully', () => {
    cy.get('button').contains('Logout').should('be.visible').click();
    cy.url().should('include', '/login');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.be.null;
    });
  });
});