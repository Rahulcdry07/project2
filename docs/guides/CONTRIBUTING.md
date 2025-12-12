# Contributing to Dynamic Web Application

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/dynamic-web-app.git
   cd dynamic-web-app
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd public/dashboard-app
   npm install
   cd ../..
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: Backend
   npm start
   
   # Terminal 2: Frontend
   cd public/dashboard-app
   npm start
   ```

## Development Process

### Branch Naming Convention

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Urgent production fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates

### Workflow

1. Create a new branch from `main`
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. Make your changes and commit frequently with clear messages

3. Write or update tests for your changes

4. Ensure all tests pass
   ```bash
   npm run test:unit
   npm run playwright:test
   ```

5. Run linters and fix any issues
   ```bash
   npm run lint
   npm run lint:fix
   ```

6. Push your branch and create a Pull Request

## Coding Standards

### JavaScript/Node.js

- Follow ESLint configuration (`.eslintrc.json`)
- Use ES6+ features (const/let, arrow functions, destructuring)
- Use async/await over callbacks or raw promises
- Handle all errors appropriately
- Use Winston logger instead of `console.log`
- Add JSDoc comments for functions and classes

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Maximum line length: 100 characters
- Use Prettier for formatting

### File Organization

```
src/
├── config/        # Configuration files
├── controllers/   # Request handlers
├── middleware/    # Express middleware
├── models/        # Database models
├── routes/        # API routes
├── utils/         # Utility functions
└── migrations/    # Database migrations
```

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build, etc.)
- **perf**: Performance improvements

### Examples

```
feat(auth): add password reset functionality

Implemented email-based password reset flow with token expiration.
Added new routes and email templates.

Closes #123
```

```
fix(admin): resolve user deletion error

Fixed null reference error when deleting users without associated records.

Fixes #456
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] All tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated (if applicable)
- [ ] No console.log statements in production code
- [ ] ESLint shows no errors or warnings
- [ ] Commits are well-organized and descriptive

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### Review Process

1. At least one maintainer must approve the PR
2. All CI/CD checks must pass
3. Conflicts must be resolved
4. Branch must be up-to-date with `main`

## Testing Requirements

### Unit Tests

- Write unit tests for all new functions and modules
- Maintain or improve code coverage (target: >80%)
- Use Mocha/Chai for backend tests
- Use Vitest for frontend tests

```bash
# Run backend unit tests
npm run test:unit

# Run frontend unit tests
cd public/dashboard-app
npm run test
```

### Integration Tests

- Test API endpoints with SuperTest
- Verify database interactions
- Test authentication flows

```bash
npm run test:backend
```

### E2E Tests

- Write Playwright tests for new UI features
- Test critical user journeys
- Ensure tests are reliable and not flaky

```bash
npm run playwright:test
```

## Documentation

### Code Documentation

- Add JSDoc comments for all public functions
- Document complex algorithms or business logic
- Update README.md for significant changes

### API Documentation

- Add Swagger annotations for new endpoints
- Include request/response examples
- Document error responses

```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 */
```

## Getting Help

- **Issues**: Check existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Refer to README.md and TESTING_GUIDE.md

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in the project README.md. Thank you for your contributions! 🎉
