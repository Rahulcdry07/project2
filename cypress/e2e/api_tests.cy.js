describe('API Tests', () => {
  beforeEach(() => {
    // Clear database
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database')
      .then(response => {
        expect(response.status).to.eq(200);
        cy.log('Database cleared successfully');
      });

    cy.wait(500); // Wait for DB operations to complete
  });

  it('should register, verify, and login a user', () => {
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };
    
    // Register user
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/register',
      body: testUser
    }).then(response => {
      expect(response.status).to.eq(201);
      expect(response.body).to.have.property('success', true);
    });
    
    // Verify user
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/test/verify-user',
      body: { email: testUser.email }
    }).then(response => {
      expect(response.status).to.eq(200);
    });
    
    // Login
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/login',
      body: { email: testUser.email, password: testUser.password }
    }).then(response => {
      expect(response.status).to.eq(200);
      expect(response.body.data).to.have.property('token');
      expect(response.body.data.token).to.be.a('string');
      
      const token = response.body.data.token;
      
      // Use token to access profile
      cy.request({
        method: 'GET',
        url: 'http://0.0.0.0:3000/api/profile',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(profileResponse => {
        expect(profileResponse.status).to.eq(200);
        expect(profileResponse.body).to.have.property('username', testUser.username);
      });
    });
  });

  it('should create and promote a user to admin', () => {
    const adminUser = {
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'adminpassword',
    };
    
    // Register admin
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/register',
      body: adminUser
    });
    
    // Verify admin
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/test/verify-user',
      body: { email: adminUser.email }
    });
    
    // Set admin role
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/test/set-user-role',
      body: { email: adminUser.email, role: 'admin' }
    }).then(response => {
      expect(response.status).to.eq(200);
    });
    
    // Login as admin
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/login',
      body: { email: adminUser.email, password: adminUser.password }
    }).then(response => {
      expect(response.status).to.eq(200);
      const token = response.body.data.token;
      
      // Access admin-only endpoint
      cy.request({
        method: 'GET',
        url: 'http://0.0.0.0:3000/api/admin/users',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(usersResponse => {
        expect(usersResponse.status).to.eq(200);
        expect(usersResponse.body).to.be.an('array');
      });
    });
  });
  
  it('should handle password reset flow', () => {
    // Register a user first
    const user = {
      username: 'resetuser',
      email: 'reset@example.com',
      password: 'password123',
    };
    
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/register', user);
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: user.email });
    
    // Request password reset
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/forgot-password',
      body: { email: user.email }
    }).then(response => {
      expect(response.status).to.eq(200);
      
      // Get the reset token via test endpoint
      cy.request({
        method: 'POST',
        url: 'http://0.0.0.0:3000/api/test/get-reset-token',
        body: { email: user.email }
      }).then(tokenResponse => {
        expect(tokenResponse.status).to.eq(200);
        expect(tokenResponse.body).to.have.property('resetToken');
        const resetToken = tokenResponse.body.resetToken;
        
        // Reset the password
        cy.request({
          method: 'POST',
          url: 'http://0.0.0.0:3000/api/auth/reset-password',
          body: {
            token: resetToken,
            password: 'newpassword123',
            confirmPassword: 'newpassword123'
          }
        }).then(resetResponse => {
          expect(resetResponse.status).to.eq(200);
          
          // Try to login with new password
          cy.request({
            method: 'POST',
            url: 'http://0.0.0.0:3000/api/auth/login',
            body: { email: user.email, password: 'newpassword123' }
          }).then(loginResponse => {
            expect(loginResponse.status).to.eq(200);
            expect(loginResponse.body.data).to.have.property('token');
          });
        });
      });
    });
  });
});