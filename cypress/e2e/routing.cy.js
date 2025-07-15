describe('Client-side Routing', () => {
    const routes = [
        '/register',
        '/login',
        '/forgot-password',
        '/verify-email',
        '/dashboard' // Assuming user is redirected or logged in to access
    ];

    routes.forEach(route => {
        it(`should load the ${route} page`, () => {
            cy.visit(route);
            cy.get('#root').should('be.visible');
            // Add more specific assertions if needed for each page
            if (route === '/register') {
                cy.contains('h2', 'Create Your Account');
            } else if (route === '/login') {
                cy.contains('h2', 'Login to Your Account');
            } else if (route === '/forgot-password') {
                cy.contains('h2', 'Forgot Your Password?');
            } else if (route === '/verify-email') {
                cy.contains('h2', 'Email Verification');
            } else if (route === '/dashboard') {
                // Dashboard requires login, so we need to log in a user first
                const user = {
                    username: 'dashboarduser',
                    email: 'dashboard@example.com',
                    password: 'password123',
                };
                cy.request({ method: 'POST', url: 'http://localhost:3000/api/register', body: user, failOnStatusCode: false });
                cy.request('POST', 'http://localhost:3000/api/test/verify-user', { email: user.email });
                cy.request('POST', 'http://localhost:3000/api/login', { email: user.email, password: user.password })
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
            }
        });
    });
});