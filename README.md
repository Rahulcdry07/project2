# Dynamic Web Application

A full-stack web application with user authentication, admin panel, and dashboard features.

## Project Overview

This application provides a complete authentication system with user registration, login, email verification, and password reset functionality. It also includes user management features for administrators and a personalized dashboard for users.

## Architecture

The project consists of:

- **Backend**: Node.js + Express RESTful API with JWT authentication
- **Frontend**: React single-page application with Bootstrap UI
- **Database**: SQLite with Sequelize ORM
- **Testing**: Comprehensive test suite with Jest, React Testing Library, and Cypress
- **CI/CD**: Automated testing and deployment with GitHub Actions
- **Security**: Helmet, rate limiting, XSS protection, and dependency scanning
- **Monitoring**: Prometheus metrics for application monitoring
- **Documentation**: Swagger API documentation

## Features

- User authentication (register, login, logout)
- Email verification system
- Password reset flow
- User profile management
- Admin panel for user management
- Protected routes based on authentication
- Responsive design
- API documentation with Swagger
- Database migrations and seeders
- Docker containerization
- Comprehensive logging with Winston
- Prometheus metrics for monitoring
- Security protections (Helmet, XSS, Rate limiting)
- Code quality tools (ESLint, Prettier)
- CI/CD with GitHub Actions

## Getting Started

### Prerequisites

- Node.js v14+ and npm

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/dynamic-web-app.git
   cd dynamic-web-app
   ```

2. Install backend dependencies
   ```
   npm install
   ```

3. Install frontend dependencies
   ```
   cd public/dashboard-app
   npm install
   cd ../..
   ```

### Running the Application

#### Using Node.js directly

1. Start the backend server
   ```
   npm start
   ```

2. In a separate terminal, start the frontend development server
   ```
   cd public/dashboard-app
   npm start
   ```

3. Access the application at:
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:3001

#### Using Docker

1. Build and run the application using Docker
   ```
   npm run docker:build
   npm run docker:run
   ```

2. Access the application at http://localhost:3000

#### Database Setup

1. Run database migrations
   ```
   npm run db:migrate
   ```

2. Seed the database with initial data
   ```
   npm run db:seed
   ```

3. Reset the database (undo migrations, migrate again, and seed)
   ```
   npm run db:reset
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key
EMAIL_SERVICE=smtp
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=no-reply@example.com
```

## Testing

### Running Backend Tests

```
npm run test:backend
```

### Running Frontend Tests

```
cd public/dashboard-app
npm test
```

### Running API Tests

The project uses a dedicated API testing strategy that works independently of the UI:

```
./run_api_tests.sh
```

This script:
1. Sets up a clean test environment
2. Runs migrations and seeders
3. Executes all API-focused Cypress tests:
   - Core API functionality tests
   - API health checks
   - Smoke tests for critical functions

### Running E2E Tests

```
npm run cy:open  # for interactive mode
npm run cy:run   # for headless mode
```

### Running Specific Cypress Tests

To run a specific test file:

```
npx cypress run --spec "cypress/e2e/smoke_test.cy.js"
```

### Performance Testing

```
npm run test:load
```

### Security Testing

```
npm run test:security
npm run test:dependencies
```

### Code Quality

```
npm run lint        # Check for code issues
npm run lint:fix    # Fix automatically fixable issues
npm run format      # Format code with Prettier
```

### Test Status and Results

For detailed information on test status and results, see:
- [TEST_STATUS.md](TEST_STATUS.md) - Current test status
- [TEST_RESULTS.md](TEST_RESULTS.md) - Detailed test results and fixes

## API Documentation

View the full API documentation using Swagger UI at `/api-docs` when the server is running.

### Authentication Endpoints

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate a user
- `POST /api/auth/verify-email`: Verify user's email
- `POST /api/auth/forgot-password`: Request password reset
- `POST /api/auth/reset-password`: Reset user's password

### User Endpoints

- `GET /api/profile`: Get current user's profile
- `PUT /api/profile`: Update user's profile

### Admin Endpoints

- `GET /api/admin/users`: Get all users
- `PUT /api/admin/users/:id/role`: Update a user's role
- `DELETE /api/admin/users/:id`: Delete a user

## Deployment

See the [Deployment Guide](DEPLOYMENT.md) for instructions on deploying to various environments.

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **Linting**: Checks code quality and formatting
- **Backend Testing**: Runs Node.js tests
- **Frontend Testing**: Runs React component tests
- **E2E Testing**: Runs Cypress end-to-end tests
- **Building**: Creates production builds
- **Security Scanning**: Checks for vulnerabilities
- **Deployment**: Deploys to production (on main branch only)

The workflow files are located in `.github/workflows/`:
- `ci-cd.yml`: Main CI/CD pipeline
- `security-scan.yml`: Security vulnerability scanning

## Monitoring and Metrics

The application includes Prometheus metrics for monitoring:

- HTTP request counts and durations
- Memory usage and Node.js metrics

Access metrics at `/api/metrics` when the server is running.

## Development Workflow

This project uses several tools to ensure code quality and consistency:

- **ESLint**: Enforces code quality rules
- **Prettier**: Ensures consistent code formatting
- **Husky**: Runs pre-commit hooks
- **lint-staged**: Runs linters on staged git files

### TypeScript Interface Generation

Generate TypeScript interfaces from Sequelize models for use in the frontend:

```
npm run generate:types
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.