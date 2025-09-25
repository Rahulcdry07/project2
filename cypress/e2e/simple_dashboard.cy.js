describe('Simple Dashboard Test', () => {
  it('should show what is actually rendered', () => {
    // Clear database and setup user
    cy.request('POST', 'http://0.0.0.0:3000/api/test/clear-database');
    
    const testUser = {
      username: 'simpleuser',
      email: 'simple@example.com',
      password: 'password123',
    };
    
    cy.request('POST', 'http://0.0.0.0:3000/api/auth/register', testUser);
    cy.request('POST', 'http://0.0.0.0:3000/api/test/verify-user', { email: testUser.email });
    
    cy.request({
      method: 'POST',
      url: 'http://0.0.0.0:3000/api/auth/login',
      body: { email: testUser.email, password: testUser.password }
    }).then((response) => {
      const token = response.body.data.token;
      
      // Visit root first
      cy.visit('/');
      
      // Set token
      cy.window().then((win) => {
        win.localStorage.setItem('token', token);
        win.localStorage.setItem('user', JSON.stringify({
          username: testUser.username,
          email: testUser.email
        }));
      });
      
      // Now visit dashboard
      cy.visit('/dashboard');
      
      // Wait for root element
      cy.get('#root', { timeout: 15000 }).should('exist');
      
      // Debug: Log all the HTML content
      cy.get('body').then(($body) => {
        cy.log('Full body HTML:');
        cy.log($body.html());
      });
      
      // Check what elements exist
      cy.get('*').then(($elements) => {
        const tagNames = [];
        $elements.each((i, el) => {
          if (el.tagName && !tagNames.includes(el.tagName)) {
            tagNames.push(el.tagName);
          }
        });
        cy.log('Available HTML tags:', tagNames.join(', '));
      });
      
      // Check specifically for text content
      cy.get('body').should('contain', 'Dashboard').then(() => {
        cy.log('✓ Found "Dashboard" text in body');
      });
      
      // Try different selectors for h1
      cy.get('body').then(($body) => {
        if ($body.find('h1').length > 0) {
          cy.log('✓ Found h1 elements');
          cy.get('h1').each(($h1) => {
            cy.log('h1 content:', $h1.text());
          });
        } else {
          cy.log('✗ No h1 elements found');
        }
        
        // Look for any headers
        const headers = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        headers.forEach(tag => {
          if ($body.find(tag).length > 0) {
            cy.log(`Found ${tag} elements:`, $body.find(tag).text());
          }
        });
      });
    });
  });
});