describe('Homepage', () => {
    beforeEach(() => {
        cy.visit('http://localhost:3001');
    });

    it('should display welcome message and navigation links', () => {
        cy.contains('Welcome to SecureReg').should('be.visible');
        cy.contains('Login').should('be.visible');
        cy.contains('Register').should('be.visible');
    });

    it('should navigate to login page', () => {
        cy.contains('Login').click();
        cy.url().should('include', '/login');
    });

    it('should navigate to register page', () => {
        cy.visit('http://localhost:3001'); // Go back to homepage
        cy.contains('Register').click();
        cy.url().should('include', '/register');
    });
});