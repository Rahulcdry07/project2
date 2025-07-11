describe('Navigation Bar', () => {
  context('User Role', () => {
    it('should show the Admin link for admin users', () => {
      cy.visit('/dashboard.html');
      
      cy.log('Setting user_role to admin in localStorage');
      cy.window().then((win) => {
        win.localStorage.setItem('user_role', 'admin');
        cy.log(`localStorage user_role: ${win.localStorage.getItem('user_role')}`);
        // Manually trigger the DOMContentLoaded event to run the nav script
        win.document.dispatchEvent(new Event('DOMContentLoaded', {
          bubbles: true,
          cancelable: true,
        }));
      });

      cy.get('#admin-panel-link').should('be.visible');
    });

    it('should hide the Admin link for non-admin users', () => {
      cy.visit('/dashboard.html');
      
      cy.log('Setting user_role to user in localStorage');
      cy.window().then((win) => {
        win.localStorage.setItem('user_role', 'user');
        cy.log(`localStorage user_role: ${win.localStorage.getItem('user_role')}`);
        // Manually trigger the DOMContentLoaded event
        win.document.dispatchEvent(new Event('DOMContentLoaded', {
          bubbles: true,
          cancelable: true,
        }));
      });

      cy.get('#admin-panel-link').should('not.be.visible');
    });
  });

  context('Logout', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('user_id', '1');
        win.localStorage.setItem('user_role', 'user');
        // Manually trigger the DOMContentLoaded event
        win.document.dispatchEvent(new Event('DOMContentLoaded', {
          bubbles: true,
          cancelable: true,
        }));
      });

      cy.intercept('POST', '/logout', {
        statusCode: 200,
        body: { success: true },
      }).as('logoutRequest');
      
      cy.intercept('POST', '/logout', {
        statusCode: 500,
        body: { success: false, message: 'Server error' },
      }).as('logoutFailure');

      cy.visit('/dashboard.html');
    });

    it('should log the user out and redirect to login on success', () => {
      cy.get('#logout-link').click();
      cy.wait('@logoutRequest');
      cy.url().should('include', 'login.html');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('user_id')).to.be.null;
      });
    });

    it('should show an alert if logout fails', () => {
      const alertStub = cy.stub();
      cy.on('window:alert', alertStub);

      cy.get('#logout-link').click();

      cy.wait('@logoutFailure').then(() => {
        expect(alertStub.getCall(0)).to.be.calledWith('Logout failed: Server error');
      });
    });
  });
});
