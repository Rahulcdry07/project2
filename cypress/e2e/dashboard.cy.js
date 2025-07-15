describe('Dashboard Page', () => {
  beforeEach(() => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    cy.request({ method: 'POST', url: 'http://localhost:3000/api/register', body: user, failOnStatusCode: false });
    cy.request('POST', 'http://localhost:3000/api/test/verify-user', { email: user.email });

    // Log in via API and set token
    cy.request('POST', 'http://localhost:3000/api/login', { email: user.email, password: user.password })
      .then((response) => {
        const token = response.body.token;
        expect(token).to.exist;
        cy.visit('/dashboard', {
          onBeforeLoad: (win) => {
            win.localStorage.setItem('token', token);
          },
        });
      });
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