describe('Homepage', () => {
    beforeEach(() => {
        cy.visit('/');
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
        cy.visit('/'); // Go back to homepage
        cy.contains('Register').click();
        cy.url().should('include', '/register');
    });
});