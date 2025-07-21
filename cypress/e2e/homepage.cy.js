/// <reference types="cypress" />

describe('Homepage Interactive Features E2E', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('body').should('not.contain', '404');
    cy.wait(1000);
  });

  it('loads the homepage and hero section', () => {
    cy.contains('Welcome to Our Platform', { timeout: 10000 }).should('be.visible');
    cy.contains('Build amazing things with our tools').should('be.visible');
  });

  it('animates the counters', () => {
    cy.get('.animated-counter', { timeout: 10000 }).should('have.length.at.least', 1);
    cy.get('.animated-counter').first().should('be.visible');
  });

  it('navigates the testimonials carousel', () => {
    cy.get('.testimonials-carousel', { timeout: 10000 }).should('exist');
    cy.get('.carousel-control-next').click();
    cy.get('.carousel-control-prev').click();
    cy.get('.carousel-indicator').first().click();
  });

  it('navigates interactive features', () => {
    cy.get('.interactive-features', { timeout: 10000 }).should('exist');
    cy.get('.feature-nav-item').eq(1).click();
    cy.get('.feature-nav-item').eq(2).trigger('mouseover');
    cy.get('.feature-detail-card').should('be.visible');
  });

  it('shows and uses the floating action button', () => {
    cy.scrollTo('bottom');
    cy.get('.floating-action-button', { timeout: 10000 }).should('be.visible').click();
    cy.contains('Login').should('be.visible');
    cy.contains('Register').should('be.visible');
    cy.get('body').click(0,0); // close menu
  });

  it('has accessible ARIA labels', () => {
    cy.get('[aria-label="Open quick actions"]', { timeout: 10000 }).should('exist');
    cy.get('[aria-label="Scroll to top"]').should('not.exist');
    cy.scrollTo('bottom');
    cy.get('[aria-label="Scroll to top"]', { timeout: 10000 }).should('exist');
  });
}); 