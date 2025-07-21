describe('Client-side Routing', () => {
  beforeEach(() => {
    // Clear database before each test
    cy.request('POST', '/api/test/clear-database');
  });

  describe('Specific Page Assertions', () => {
    it('should display error page for invalid routes', () => {
      cy.visit('/non-existent', { failOnStatusCode: false });
      cy.contains('404').should('exist');
      cy.contains('Page Not Found').should('exist');
    });
  });

  describe('Redirection Checks', () => {
    it('should redirect unauthorized user trying to access dashboard', () => {
      cy.visit('/dashboard', { failOnStatusCode: false });
      cy.url().should('include', '/login');
      cy.contains('h2', 'Login to Your Account');
    });

    it('should redirect unauthorized user trying to access profile', () => {
      cy.visit('/profile', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('should redirect unauthorized user trying to access admin', () => {
      cy.visit('/admin', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });
  });

  const routes = [
    '/register',
    '/login',
    '/forgot-password',
    '/verify-email'
  ];

  routes.forEach(route => {
    it(`should load the ${route} page`, () => {
      cy.visit(route);
      cy.get('body').should('be.visible');
      
      if (route === '/register') {
        cy.get('form').should('be.visible');
        cy.contains('h2', 'Create Your Account');
      } else if (route === '/login') {
        cy.get('#email').should('exist');
        cy.contains('h2', 'Login to Your Account');
      } else if (route === '/forgot-password') {
        cy.get('input[type="email"]').should('exist');
        cy.contains('h2', 'Forgot Your Password?');
      } else if (route === '/verify-email') {
        cy.contains('h2', 'Verify Your Email Address');
      }
    });
  });

  describe('Protected Routes', () => {
    it('should allow access to dashboard when authenticated', () => {
      const user = {
        username: 'dashboarduser',
        email: 'dashboard@example.com',
        password: 'DashPass123!',
      };
      
      cy.request('POST', '/api/register', user);
      cy.request('POST', '/api/test/verify-user', { email: user.email });
      
      cy.request('POST', '/api/login', { email: user.email, password: user.password })
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

    it('should allow access to profile when authenticated', () => {
      const user = {
        username: 'profileuser',
        email: 'profile@example.com',
        password: 'ProfilePass123!',
      };
      
      cy.request('POST', '/api/register', user);
      cy.request('POST', '/api/test/verify-user', { email: user.email });
      
      cy.request('POST', '/api/login', { email: user.email, password: user.password })
        .then((response) => {
          const token = response.body.token;
          expect(token).to.exist;
          cy.visit('/profile', {
            onBeforeLoad: (win) => {
              win.localStorage.setItem('token', token);
            },
          });
        });
      
      cy.contains('h2', 'Your Profile');
    });

    it('should allow access to admin when authenticated as admin', () => {
      cy.loginAsAdmin();
      cy.visit('/admin');
      cy.contains('h1', 'Admin Dashboard');
    });
  });

  describe('Navigation Between Pages', () => {
    it('should navigate from login to register', () => {
      cy.visit('/login');
      cy.get('a[href="/register"]').first().click();
      cy.url().should('include', '/register');
    });

    it('should navigate from register to login', () => {
      cy.visit('/register');
      cy.get('a[href="/login"]').first().click();
      cy.url().should('include', '/login');
    });

    it('should navigate from login to forgot password', () => {
      cy.visit('/login');
      cy.get('a[href="/forgot-password"]').first().click();
      cy.url().should('include', '/forgot-password');
    });

    it('should navigate from forgot password to login', () => {
      cy.visit('/forgot-password');
      cy.get('a[href="/login"]').first().click();
      cy.url().should('include', '/login');
    });
  });

  describe('URL Parameters', () => {
    it('should handle verification token in URL', () => {
      cy.visit('/verify-email?token=testtoken');
      cy.url().should('include', '/verify-email');
      cy.url().should('include', 'token=testtoken');
    });

    it('should handle reset token in URL', () => {
      cy.visit('/reset-password?token=testtoken');
      cy.url().should('include', '/reset-password');
      cy.url().should('include', 'token=testtoken');
    });
  });
});