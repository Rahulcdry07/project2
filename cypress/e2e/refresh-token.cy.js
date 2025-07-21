describe('Refresh Token Flow', () => {
  beforeEach(() => {
    // Clear database before each test
    cy.request('POST', '/api/test/clear-database');
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should provide refresh token on successful login', () => {
    const user = {
      username: 'refreshtestuser',
      email: 'refreshtest@example.com',
      password: 'RefreshTest123!',
    };

    // Register and verify user
    cy.request('POST', '/api/register', user);
    cy.request('POST', '/api/test/verify-user', { email: user.email });

    // Login and verify both tokens are provided
    cy.request('POST', '/api/login', { email: user.email, password: user.password })
      .then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.token).to.exist;
        expect(response.body.refreshToken).to.exist;
        expect(response.body.message).to.include('Login successful');
      });
  });

  it('should refresh access token with valid refresh token', () => {
    const user = {
      username: 'refreshtestuser2',
      email: 'refreshtest2@example.com',
      password: 'RefreshTest123!',
    };

    // Register, verify, and login user
    cy.request('POST', '/api/register', user);
    cy.request('POST', '/api/test/verify-user', { email: user.email });
    
    cy.request('POST', '/api/login', { email: user.email, password: user.password })
      .then((loginResponse) => {
        const refreshToken = loginResponse.body.refreshToken;
        
        // Use refresh token to get new access token
        cy.request({
          method: 'POST',
          url: '/api/refresh-token',
          body: { refreshToken }
        }).then((refreshResponse) => {
          expect(refreshResponse.status).to.eq(200);
          expect(refreshResponse.body.token).to.exist;
          expect(refreshResponse.body.message).to.include('Token refreshed successfully');
          
          // Verify the new token is different from the original
          expect(refreshResponse.body.token).to.not.eq(loginResponse.body.token);
        });
      });
  });

  it('should reject invalid refresh token', () => {
    cy.request({
      method: 'POST',
      url: '/api/refresh-token',
      body: { refreshToken: 'invalid-token' },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.error).to.include('Invalid or expired refresh token');
    });
  });

  it('should reject request without refresh token', () => {
    cy.request({
      method: 'POST',
      url: '/api/refresh-token',
      body: {},
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.include('Refresh token is required');
    });
  });

  it('should invalidate refresh token on logout', () => {
    const user = {
      username: 'logouttestuser',
      email: 'logouttest@example.com',
      password: 'LogoutTest123!',
    };

    // Register, verify, and login user
    cy.registerUser(user);
    cy.verifyUser(user.email);
    
    cy.request('POST', '/api/login', { email: user.email, password: user.password })
      .then((loginResponse) => {
        const { token, refreshToken } = loginResponse.body;
        
        // Logout
        cy.request({
          method: 'POST',
          url: '/api/logout',
          headers: { 'Authorization': `Bearer ${token}` }
        }).then((logoutResponse) => {
          expect(logoutResponse.status).to.eq(200);
          expect(logoutResponse.body.message).to.include('Logout successful');
          
          // Try to use the refresh token after logout
          cy.request({
            method: 'POST',
            url: '/api/refresh-token',
            body: { refreshToken },
            failOnStatusCode: false
          }).then((refreshResponse) => {
            expect(refreshResponse.status).to.eq(401);
            expect(refreshResponse.body.error).to.include('Invalid or expired refresh token');
          });
        });
      });
  });

  it('should handle token refresh in frontend automatically', () => {
    const user = {
      username: 'autorefreshtestuser',
      email: 'autorefreshtest@example.com',
      password: 'AutoRefreshTest123!',
    };

    // Register and verify user
    cy.registerUser(user);
    cy.verifyUser(user.email);

    // Login and set tokens
    cy.request('POST', '/api/login', { email: user.email, password: user.password })
      .then((response) => {
        const { token, refreshToken } = response.body;
        
        cy.visit('/dashboard', {
          onBeforeLoad: (win) => {
            win.localStorage.setItem('token', token);
            win.localStorage.setItem('refreshToken', refreshToken);
          },
        });
      });

    // Verify dashboard loads successfully
    cy.get('h1').should('contain', 'Dashboard');
    cy.get('#username').should('contain', 'autorefreshtestuser');
  });

  it('should handle expired access token with valid refresh token', () => {
    const user = {
      username: 'expiredtokentestuser',
      email: 'expiredtokentest@example.com',
      password: 'ExpiredTokenTest123!',
    };

    // Register and verify user
    cy.registerUser(user);
    cy.verifyUser(user.email);

    // Login and get tokens
    cy.request('POST', '/api/login', { email: user.email, password: user.password })
      .then((response) => {
        const { token, refreshToken } = response.body;
        
        // Simulate expired access token by using an invalid one
        cy.visit('/dashboard', {
          onBeforeLoad: (win) => {
            win.localStorage.setItem('token', 'expired-token');
            win.localStorage.setItem('refreshToken', refreshToken);
          },
        });
      });

    // Should still be able to access dashboard due to automatic token refresh
    cy.get('h1').should('contain', 'Dashboard');
  });
}); 