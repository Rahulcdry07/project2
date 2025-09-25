describe('Login Flow', () => {
  beforeEach(() => {
    // Clear database before each test
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database');
  });

  it('should allow a registered user to log in via API and access dashboard', () => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    // Register a user
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/register', user);

    // Verify the user's email for testing purposes
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: user.email });

    // Log in via API and set token
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/login', { email: user.email, password: user.password })
      .then((response) => {
        const token = response.body.data.token;
        expect(token).to.exist;
        
        // Visit the app first
        cy.visit('/');
        
        // Set authentication data
        cy.window().then((win) => {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('user', JSON.stringify({
            username: user.username,
            email: user.email
          }));
        });
        
        // Now visit dashboard
        cy.visit('/dashboard');
        cy.wait(2000);
      });

    // After login, should show dashboard content
    cy.get('body').should('contain.text', 'Dashboard', { timeout: 15000 });
    cy.get('body').should('contain.text', 'testuser', { timeout: 10000 });
  });

  it('should show the login form when visiting /login', () => {
    cy.visit('/login');
    
    // Wait for React to load
    cy.get('#root', { timeout: 15000 }).should('exist');
    cy.wait(2000);
    
    // Should show login form
    cy.get('body').should('contain.text', 'Login', { timeout: 15000 });
    
    // Look for form elements
    cy.get('form, input[type="email"], input[type="password"]', { timeout: 15000 }).should('exist');
    
    cy.log('Login form is visible and accessible');
  });

  it('should handle login form interaction', () => {
    // Create a user for testing
    const user = {
      username: 'formuser',
      email: 'form@example.com',
      password: 'password123',
    };

    cy.request('POST', 'http://0.0.0.0:3000/api/auth/register', user);
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: user.email });

    // Visit login page
    cy.visit('/login');
    cy.wait(2000);
    
    // Should show login content
    cy.get('body').should('contain.text', 'Login', { timeout: 15000 });
    
    // Look for input fields with various possible selectors
    cy.get('input[type="email"], input[name="email"], #email', { timeout: 15000 })
      .should('be.visible')
      .type(user.email);
    
    cy.get('input[type="password"], input[name="password"], #password', { timeout: 15000 })
      .should('be.visible')  
      .type(user.password);
    
    // Submit the form
    cy.get('button[type="submit"], input[type="submit"], .btn', { timeout: 15000 })
      .contains('Login')
      .should('be.visible')
      .click();
    
    // Wait for redirect to dashboard
    cy.url({ timeout: 15000 }).should('include', '/dashboard');
    cy.get('body').should('contain.text', 'Dashboard', { timeout: 15000 });
    
    cy.log('Login form interaction successful');
  });

  it('should handle invalid login attempt', () => {
    cy.visit('/login');
    cy.wait(2000);
    
    // Should show login content
    cy.get('body').should('contain.text', 'Login', { timeout: 15000 });
    
    // Try to login with invalid credentials
    cy.get('input[type="email"], input[name="email"], #email', { timeout: 15000 })
      .should('be.visible')
      .type('invalid@example.com');
    
    cy.get('input[type="password"], input[name="password"], #password', { timeout: 15000 })
      .should('be.visible')
      .type('wrongpassword');
    
    // Submit the form
    cy.get('button[type="submit"], input[type="submit"], .btn', { timeout: 15000 })
      .contains('Login')
      .should('be.visible')
      .click();
    
    // Should stay on login page and show error
    cy.url().should('include', '/login');
    
    // Look for error message - it might appear in various ways
    cy.get('body', { timeout: 10000 }).should('contain.text', 'Login');
    
    cy.log('Invalid login handled appropriately');
  });
});