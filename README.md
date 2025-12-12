# Dynamic Web Application

A full-stack web application with user authentication, admin panel, and dashboard features.

## Project Overview

This application provides a complete authentication system with user registration, login, email verification, and password reset functionality. It also includes user management features for administrators and a personalized dashboard for users.

## Architecture

The project consists of:

- **Backend**: Node.js + Express RESTful API with JWT authentication
- **Frontend**: React single-page application with Bootstrap UI
- **Database**: SQLite with Sequelize ORM
- **Testing**: Comprehensive test suite with Jest, React Testing Library, and Playwright
- **CI/CD**: Automated testing and deployment with GitHub Actions
- **Security**: Helmet, rate limiting, XSS protection, and dependency scanning
- **Monitoring**: Prometheus metrics for application monitoring
- **Documentation**: Swagger API documentation

## Project Structure

```
project2/
├── config/              # Configuration files
│   ├── babel/          # Babel transpilation config
│   ├── eslint/         # ESLint linting rules
│   └── playwright/     # Playwright E2E test config
├── docs/               # Documentation
│   ├── guides/         # Developer guides
│   └── testing/        # Testing documentation
├── public/             # Static frontend assets
│   ├── css/           # Stylesheets
│   └── dashboard-app/ # React application
├── scripts/           # Utility scripts
├── src/               # Backend source code
│   ├── config/        # App configuration
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Express middleware
│   ├── models/        # Sequelize models
│   ├── routes/        # API routes
│   └── utils/         # Helper utilities
├── test/              # Backend tests
└── tests/             # E2E tests
    └── playwright/    # Playwright test files
```

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

**⚠️ MANDATORY: All tests must pass before committing any code changes!**

### Quick Test Commands

```bash
# Verify all tests pass (REQUIRED before commit)
npm run test:verify

# Run all backend tests (172 tests)
npm run test:unit

# Run all frontend tests (177 tests)
npm run test:frontend

# Run both backend and frontend
npm run test:quick
```

### Test Coverage Summary

Current test status: **349/349 tests passing (100%)**

| Test Suite | Tests | Status |
|------------|-------|--------|
| Backend Total | 172 | ✅ 100% |
| - Models | 19 | ✅ 100% |
| - Controllers | 30 | ✅ 100% |
| - Tender API | 28 | ✅ 100% |
| - Middleware | 21 | ✅ 100% |
| - Utilities | 24 | ✅ 100% |
| - Security | 18 | ✅ 100% |
| - Integration | 32 | ✅ 100% |
| Frontend Total | 177 | ✅ 100% |
| - Components | 90+ | ✅ 100% |
| - Hooks | 40+ | ✅ 100% |
| - Services | 40+ | ✅ 100% |

### Individual Test Suites

```bash
# Backend specific tests
npm run test:models        # User model validation (19 tests)
npm run test:controllers   # Auth, Profile, Admin (30 tests)
npm run test:tenders       # Tender CRUD operations (28 tests)
npm run test:middleware    # Auth & security middleware (21 tests)
npm run test:utils         # Utilities & helpers (24 tests)
npm run test:security-unit # Security tests (18 tests)
npm run test:backend       # Integration tests (32 tests)

# Frontend tests
cd public/dashboard-app
npm test                   # All frontend tests (177 tests)
npm test -- --run         # Run once without watch
npm test TenderList       # Specific component tests
```

### Pre-Commit Testing

**Automated checks run on every commit:**

1. ✅ **Linting** - ESLint code quality checks
2. ✅ **Backend Tests** - All 172 backend tests
3. ✅ **Frontend Tests** - All 177 frontend tests

**If any test fails, the commit will be blocked automatically.**

See [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) for the complete testing checklist.

### Security Testing

```bash
npm run test:security      # Audit dependencies
npm run test:dependencies  # Scan for vulnerabilities
```

### Performance Testing

```bash
npm run test:load         # Artillery load testing
```

### Code Quality

```bash
npm run lint              # Check for code issues
npm run lint:fix          # Fix automatically fixable issues
npm run format            # Format code with Prettier
```

### Test Documentation

For detailed testing information, see:
- [TESTING_CHECKLIST.md](TESTING_CHECKLIST.md) - Mandatory checklist before commit
- [TEST_COVERAGE_REPORT.md](TEST_COVERAGE_REPORT.md) - Comprehensive coverage report
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Complete testing guide
- [TESTING_MIGRATION.md](TESTING_MIGRATION.md) - Testing infrastructure details

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
- **E2E Testing**: Runs Playwright end-to-end tests
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

Please read [docs/guides/CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

For testing documentation, see:
- [docs/testing/TESTING_GUIDE.md](docs/testing/TESTING_GUIDE.md) - Comprehensive testing guide
- [docs/testing/CI_TEST.md](docs/testing/CI_TEST.md) - CI/CD testing setup
- [docs/testing/TESTING_MIGRATION.md](docs/testing/TESTING_MIGRATION.md) - Migration from Cypress to Playwright

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.