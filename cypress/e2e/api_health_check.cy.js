describe('API Endpoint Health Check', () => {
  beforeEach(() => {
    // Clear database before each test
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database');
  });

  it('should return 200 for /api/test/clear-database', () => {
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database')
      .its('status').should('eq', 200);
  });

  it('should return 404 for /api/test/verify-user if user not found', () => {
    cy.request({ 
      method: 'POST', 
      url: 'http://0.0.0.0:3000/api/test/verify-user', 
      body: { email: 'test@example.com' }, 
      failOnStatusCode: false 
    }).its('status').should('eq', 404);
  });

  it('should return 404 for /api/test/set-user-role if user not found', () => {
    cy.request({ 
      method: 'POST', 
      url: 'http://0.0.0.0:3000/api/test/set-user-role', 
      body: { email: 'test@example.com', role: 'user' }, 
      failOnStatusCode: false 
    }).its('status').should('eq', 404);
  });

  it('should have general health endpoint working', () => {
    cy.request('http://0.0.0.0:3000/api/health').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('status');
    });
  });

  it('should have auth endpoints working properly', () => {
    // Register a user
    const testUser = {
      username: 'healthuser',
      email: 'health@example.com',
      password: 'password123'
    };
    
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/register',
      body: testUser
    }).then((response) => {
      expect(response.status).to.eq(201);
      
      // Verify the user
      cy.request({
        method: 'POST',
        url: 'http://0.0.0.0:3000/api/test/verify-user',
        body: { email: testUser.email }
      }).then(() => {
        // Login with the user
        cy.request({
          method: 'POST',
          url: 'http://0.0.0.0:3000/api/auth/login',
          body: {
            email: testUser.email,
            password: testUser.password
          }
        }).then((loginResponse) => {
          expect(loginResponse.status).to.eq(200);
          expect(loginResponse.body.data).to.have.property('token');
          
          const token = loginResponse.body.data.token;
          
          // Access profile with token
          cy.request({
            method: 'GET',
            url: 'http://0.0.0.0:3000/api/profile',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }).then((profileResponse) => {
            expect(profileResponse.status).to.eq(200);
            expect(profileResponse.body).to.have.property('username', testUser.username);
          });
        });
      });
    });
  });
  
  it('should properly handle invalid login attempts', () => {
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/login',
      body: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body).to.have.property('success', false);
    });
  });
  
  it('should handle registration validation properly', () => {
    // Test with invalid email
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/register',
      body: {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property('success', false);
    });
    
    // Test with short password
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/register',
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: '123'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property('success', false);
    });
  });
});