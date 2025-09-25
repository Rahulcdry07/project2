describe('Application Smoke Test', () => {
  // Test that ensures the API server is up and healthy
  it('API server should be healthy', () => {
    cy.request('http://0.0.0.0:3000/api/health').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('status');
    });
  });
  
  // Test that the root path is accessible
  it('should be able to access the root path', () => {
    cy.visit('/', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
  });
  
  // Test the critical user flow: register, login, access protected route
  it('should support the core user flow', () => {
    // Create a unique user for this test
    const username = `smokeuser_${Date.now()}`;
    const email = `smoke_${Date.now()}@example.com`;
    const password = 'password123';
    
    // Register
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/register',
      body: { username, email, password }
    }).then((response) => {
      expect(response.status).to.eq(201);
      
      // Verify
      cy.request({
        method: 'POST',
        url: 'http://0.0.0.0:3000/api/test/verify-user',
        body: { email }
      });
      
      // Login
      cy.request({
        method: 'POST',
        url: 'http://0.0.0.0:3000/api/auth/login',
        body: { email, password }
      }).then((loginResponse) => {
        expect(loginResponse.status).to.eq(200);
        expect(loginResponse.body.data).to.have.property('token');
        
        const token = loginResponse.body.data.token;
        
        // Access protected profile endpoint
        cy.request({
          method: 'GET',
          url: 'http://0.0.0.0:3000/api/profile',
          headers: { 'Authorization': `Bearer ${token}` }
        }).then((profileResponse) => {
          expect(profileResponse.status).to.eq(200);
          expect(profileResponse.body).to.have.property('username', username);
        });
      });
    });
  });
  
  // Test that database operations are working
  it('should be able to perform database operations', () => {
    // Clear the database
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database').then((response) => {
      expect(response.status).to.eq(200);
      
      // Create a user
      const user = {
        username: 'dbuser',
        email: 'db@example.com',
        password: 'password123'
      };
      
      cy.request({
        method: 'POST',
        url: 'http://0.0.0.0:3000/api/auth/register',
        body: user
      }).then((registerResponse) => {
        expect(registerResponse.status).to.eq(201);
        
        // Verify the user
        cy.request({
          method: 'POST',
          url: 'http://0.0.0.0:3000/api/test/verify-user',
          body: { email: user.email }
        }).then((verifyResponse) => {
          expect(verifyResponse.status).to.eq(200);
          
          // Set as admin
          cy.request({
            method: 'POST',
            url: 'http://0.0.0.0:3000/api/test/set-user-role',
            body: { email: user.email, role: 'admin' }
          }).then((roleResponse) => {
            expect(roleResponse.status).to.eq(200);
            
            // Login as admin
            cy.request({
              method: 'POST',
              url: 'http://0.0.0.0:3000/api/auth/login',
              body: { email: user.email, password: user.password }
            }).then((loginResponse) => {
              expect(loginResponse.status).to.eq(200);
              const token = loginResponse.body.data.token;
              
              // Check admin privileges
              cy.request({
                method: 'GET',
                url: 'http://0.0.0.0:3000/api/admin/users',
                headers: { 'Authorization': `Bearer ${token}` }
              }).then((usersResponse) => {
                expect(usersResponse.status).to.eq(200);
                expect(usersResponse.body).to.be.an('array');
                expect(usersResponse.body).to.have.length.at.least(1);
              });
            });
          });
        });
      });
    });
  });
});