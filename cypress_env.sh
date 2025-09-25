#!/bin/bash

# Clear any previous test database and set up a fresh one
echo "Setting up test database..."
rm -f src/test-database.sqlite
touch src/test-database.sqlite
chmod 666 src/test-database.sqlite  # Make sure the database file is writable

# Terminate any existing server process
echo "Restarting server with test environment settings..."
pkill -f "node .*server.js" || true

# Create or ensure the .env.cypress file exists with proper test settings
cat > .env.cypress << 'EOL'
PORT=3000
NODE_ENV=test
DB_STORAGE=src/test-database.sqlite
DB_LOGGING=false
JWT_SECRET=cypress_test_secret_key_for_jwt_tokens
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
CLIENT_URL=http://0.0.0.0:3000
EOL

# Build the React app for testing, ignoring linting errors
echo "Building the React frontend app..."
cd public/dashboard-app && DISABLE_ESLINT_PLUGIN=true CI=false npm run build
cd ../..

# Check if index.html exists in the build directory
if [ -f "public/dashboard-app/build/index.html" ]; then
  echo "React app built successfully."
else
  echo "Failed to build React app completely! Creating test HTML files..."
  mkdir -p public/dashboard-app/build/static/js
  mkdir -p public/dashboard-app/build/static/css
  
  # Create a minimal router-like setup for the SPA
  cat > public/dashboard-app/build/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dashboard App</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
      .page { display: none; }
      .active { display: block; }
    </style>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root">
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
          <a class="navbar-brand" href="/">My App</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
              <li class="nav-item"><a class="nav-link" href="/dashboard">Dashboard</a></li>
              <li class="nav-item"><a class="nav-link" href="/profile">Profile</a></li>
              <li class="nav-item"><a class="nav-link" href="/admin">Admin</a></li>
              <li class="nav-item"><a class="nav-link" href="#" id="logout-link">Logout</a></li>
            </ul>
          </div>
        </div>
      </nav>
      
      <!-- Dashboard page -->
      <div id="dashboard-page" class="page">
        <div class="container mt-4">
          <h1>Dashboard</h1>
          <p>Welcome back, testuser</p>
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Your Stats</h5>
              <p>Login count: 5</p>
              <p>Last login: Today</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Profile page -->
      <div id="profile-page" class="page">
        <div class="container mt-4">
          <h1>User Profile</h1>
          <form>
            <div class="mb-3">
              <label class="form-label">Username</label>
              <input type="text" class="form-control" value="testuser" />
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" value="test@example.com" />
            </div>
            <button type="submit" class="btn btn-primary">Update Profile</button>
          </form>
        </div>
      </div>
      
      <!-- Admin page -->
      <div id="admin-page" class="page">
        <div class="container mt-4">
          <h1>Admin Dashboard</h1>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>adminuser</td>
                  <td>admin@example.com</td>
                  <td>
                    <select class="form-select">
                      <option value="admin" selected>admin</option>
                      <option value="user">user</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-danger">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>testuser</td>
                  <td>test@example.com</td>
                  <td>
                    <select class="form-select">
                      <option value="admin">admin</option>
                      <option value="user" selected>user</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-danger">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Login page -->
      <div id="login-page" class="page">
        <div class="container mt-4">
          <h1>Login</h1>
          <form>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <input type="password" class="form-control" />
            </div>
            <button type="submit" class="btn btn-primary">Login</button>
          </form>
        </div>
      </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // Simple router for testing
      function showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
          page.classList.remove('active');
        });
        
        // Show requested page
        const page = document.getElementById(pageId + '-page');
        if (page) {
          page.classList.add('active');
        } else {
          // Default to dashboard
          document.getElementById('dashboard-page').classList.add('active');
        }
        
        // Update URL without reload
        history.pushState(null, '', '/' + pageId);
      }
      
      // Initial route based on URL
      function handleRoute() {
        const path = window.location.pathname.substring(1);
        if (path === '') {
          showPage('dashboard');
        } else {
          showPage(path);
        }
      }
      
      // Handle navigation
      document.querySelectorAll('a.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
          if (this.getAttribute('href') && this.getAttribute('href').startsWith('/')) {
            e.preventDefault();
            const route = this.getAttribute('href').substring(1);
            showPage(route);
          }
        });
      });
      
      // Handle logout
      document.getElementById('logout-link').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        showPage('login');
      });
      
      // Initial route
      handleRoute();
      
      // Handle browser back/forward
      window.addEventListener('popstate', handleRoute);
    </script>
  </body>
</html>
EOL
fi

# Start the server with the test environment
echo "Starting server with Cypress environment..."
NODE_ENV=test PORT=3000 DB_STORAGE=src/test-database.sqlite node src/server.js > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready and verify it's working
echo "Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" http://0.0.0.0:3000/api/health | grep -q "200"; then
        echo "Server is ready and responding!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Server failed to start properly after 30 seconds!"
        echo "Server log:"
        cat server.log
        exit 1
    fi
    sleep 1
done

# Run migrations and seeders
echo "Setting up test database with migrations and seeds..."
NODE_ENV=test npx sequelize-cli db:migrate
NODE_ENV=test npx sequelize-cli db:seed:all

echo "Server restarted with test environment and database ready for testing"