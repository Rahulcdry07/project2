describe('Pricing Page', () => {
  beforeEach(() => {
    // Mock the API endpoint for fetching plans
    cy.intercept('GET', '/api/plans', {
      statusCode: 200,
      body: {
        success: true,
        plans: [
          { id: 1, name: 'Basic', price: '9.99', description: 'Basic Plan Features', features: 'Feature A, Feature B' },
          { id: 2, name: 'Pro', price: '19.99', description: 'Pro Plan Features', features: 'Feature C, Feature D' },
        ],
      },
    }).as('getPlans');

    cy.visit('/pricing.html');
  });

  it('should display pricing plans on load', () => {
    cy.wait('@getPlans');
    cy.get('#plans-grid').children().should('have.length', 2);
    cy.get('#plans-grid').should('contain.text', 'Basic').and('contain.text', 'Pro');
  });

  it('should allow a user to select a plan and redirect to the dashboard', () => {
    // Mock the subscription endpoint
    cy.intercept('POST', '/api/subscribe', {
      statusCode: 200,
      body: { success: true, message: 'Subscription successful!' },
    }).as('subscribeRequest');

    cy.wait('@getPlans');

    // Click the select button for the first plan
    cy.get('.btn-select').first().click();

    // Cypress handles the confirm dialog automatically, accepting it by default.

    cy.wait('@subscribeRequest');

    // Check for the alert message (since the original code uses alert)
    // We can spy on window.alert to verify it was called.
    cy.on('window:alert', (str) => {
      expect(str).to.equal('Subscription successful!');
    });

    // Check for redirection
    cy.url().should('include', 'dashboard.html');
  });

  it('should show an error if fetching plans fails', () => {
    // Override the interceptor for a failure case
    cy.intercept('GET', '/api/plans', {
      statusCode: 500,
      body: { success: false, message: 'Failed to load plans' },
    }).as('getPlansFailure');

    // Re-visit the page to trigger the new intercept
    cy.visit('/pricing.html');

    cy.wait('@getPlansFailure');
    cy.get('#plans-grid').should('contain.text', 'Failed to load plans. Please try again later.');
  });
});