
# SecureReg: Tender Management Platform

SecureReg is a full-stack web application for secure tender management, featuring robust user authentication, an admin panel, and a modern dashboard experience. The platform is designed for organizations to manage tenders, applications, and user access with a focus on security and usability.

## Project Overview


The platform provides:
- Secure user authentication (registration, login, email verification, password reset)
- A React-based dashboard for users and admins
- Public authentication pages (Forgot Password, Reset Password, Email Verification)
- Admin features for user and tender management
- Personalized dashboard for users

## Architecture


## Architecture

- **Backend**: Node.js + Express RESTful API with JWT authentication
- **Frontend**: SecureReg Dashboard App (React SPA, Bootstrap UI)
- **Public Pages**: Forgot Password, Reset Password, Email Verification (HTML/CSS)
- **Database**: SQLite with Sequelize ORM
- **Testing**: Jest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions
- **Security**: Helmet, rate limiting, XSS protection, dependency scanning
- **Monitoring**: Prometheus metrics
- **Documentation**: Swagger API


## Key Features

- Secure user authentication (register, login, logout)
- Email verification and password reset flows
- User profile management
- Admin panel for user and tender management
- Tender catalogue with filters and pagination
- Protected dashboard and routes
- Responsive, modern UI (React + Bootstrap)
- API documentation (Swagger)
- Database migrations and seeders
- Docker containerization
- Logging (Winston)
- Prometheus metrics
- Security best practices (Helmet, XSS, Rate limiting)
- Code quality tools (ESLint, Prettier)
- CI/CD with GitHub Actions


## Website Overview

- **Main Entry Point:** [SecureReg Dashboard App](public/dashboard-app/build/index.html#/login) (React SPA)
- **Public Pages:**
   - `/forgot-password.html` — Request password reset
   - `/reset-password.html` — Set a new password
   - `/verify-email.html` — Email verification
- **User Experience:**
   - New users register and verify their email
   - Users log in to access a personalized dashboard
   - Admins manage users and tenders via the dashboard
   - All authentication flows are secure and user-friendly


### Prerequisites

- Node.js v14+ and npm


### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/secure-reg.git
   cd secure-reg
   ```

2. Install backend dependencies
   ```bash
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd public/dashboard-app
   npm install
   cd ../..
   ```


### Running the Application

#### Using Node.js directly

1. Run database migrations and seed the reference data (safe to re-run)
   ```
   npm run db:migrate
   npm run db:seed
   ```

2. Start the backend server
   ```
   npm start
   ```

3. In a separate terminal, start the frontend development server
   ```
   cd public/dashboard-app
   npm start
   ```


4. Access the application at:
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:3001 (or via `/dashboard-app/build/index.html` for production build)

#### Using Docker

1. Build and run the application using Docker
   ```
   npm run docker:build
   npm run docker:run
   ```


2. Access the application at http://localhost:3000 (SPA dashboard and API)

#### Database Setup

1. Run database migrations
   ```
   npm run db:migrate
   ```

2. Seed the database with initial data (idempotent seeders that skip existing rows)
   ```
   npm run db:seed
   ```

   Need to only refresh tender sample data? Run the targeted seeder:
   ```
   npx sequelize-cli db:seed --seed 20251212000000-sample-tenders.js
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

# Admin Bootstrap (auto-provisioned on server start)
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
RESET_ADMIN_PASSWORD=false
```

**Note on Admin Bootstrapping**: The server automatically ensures a verified admin user exists on startup using the credentials configured above. If you need to rotate the admin password, set `RESET_ADMIN_PASSWORD=true` and restart the server. The admin account will be updated to the specified username, email, and password, and will be marked as verified.

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

### Running E2E Tests

```
npm run playwright:test     # Run all tests
npm run pw:ui              # Interactive UI mode  
npm run pw:smoke           # Smoke tests only
npm run playwright:report  # View test reports
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

### Tender Listing & Pagination

- `GET /api/tenders`: Public tender catalogue with filters and server-side pagination.
   - **Query parameters**
      - `page` (default `1`): 1-indexed page number, automatically clamped to at least 1 and at most the last available page.
      - `pageSize` (default `9`): results per page. Accepted range is 1-50; larger values are capped at 50 to keep responses fast.
      - Optional filters: `category`, `location`, `status`, `q` (keyword search across title, description, organization).
   - **Response shape**
      ```json
      {
         "success": true,
         "tenders": [ /* current page of tenders */ ],
         "pagination": {
            "page": 2,
            "pageSize": 9,
            "total": 37,
            "totalPages": 5
         }
      }
      ```
   - The dashboard's `TenderList` component consumes this metadata to show accurate result counts, next/previous controls, and user-selectable page sizes (6/9/12/24). Filters automatically reset the page back to 1 so users never land on an empty page after narrowing their search.

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

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.


## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.