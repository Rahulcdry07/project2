# Backend Tests

This directory contains comprehensive backend tests for the registration and authentication system.

## Test Structure

### 1. `backend.test.js` - Core API Tests
Tests all individual API endpoints and their functionality:
- **User Registration**: Validation, duplicate handling, password requirements
- **User Login**: Authentication, token generation, error handling
- **Email Verification**: Token validation, user verification
- **Password Reset**: Request, token generation, password change
- **User Profile**: CRUD operations, authentication requirements
- **Admin Functions**: Role management, user deletion, authorization
- **Rate Limiting**: Protection against brute force attacks
- **Error Handling**: Malformed requests, validation errors
- **Test Endpoints**: Helper endpoints for testing

### 2. `security.test.js` - Security-Focused Tests
Comprehensive security testing:
- **JWT Authentication**: Token validation, expiration, format
- **Password Security**: Hashing, strength validation, verification
- **Input Validation**: Email format, username format, SQL injection prevention
- **Authorization**: Role-based access control, admin privileges
- **Rate Limiting**: Authentication attempt limits
- **Security Headers**: XSS protection, clickjacking prevention
- **Token Security**: Information exposure, expiration times

### 3. `integration.test.js` - End-to-End Workflows
Complete user journey testing:
- **Registration Flow**: Register → Verify → Login
- **Password Reset Flow**: Request → Token → Reset → Login
- **Profile Management**: Login → Update → Change Password → Re-login
- **Admin Management**: Login → Update Role → Delete User
- **Error Handling**: Concurrent requests, database issues
- **API Consistency**: Response format validation

### 4. `test.config.js` - Test Configuration
Environment setup for testing:
- Test environment variables
- Database configuration
- Test user credentials
- Timeout settings

## Running Tests

### Prerequisites
1. Install dependencies: `npm install`
2. Create `.env` file with test configuration
3. Ensure database is accessible

### Test Commands

```bash
# Run all backend tests
npm run test:all

# Run specific test suites
npm run test:backend      # Core API tests
npm run test:security     # Security tests
npm run test:integration  # Integration tests

# Run with coverage (requires nyc)
npm run test:coverage

# Run individual test files
npx mocha test/backend.test.js
npx mocha test/security.test.js
npx mocha test/integration.test.js
```

### Test Environment

The tests use:
- **NODE_ENV=test**: Enables test-specific behavior
- **In-memory SQLite**: Fast, isolated database for each test
- **Test JWT Secret**: Dedicated secret for testing
- **Mocked Email**: Email sending is disabled in test mode

## Test Coverage

### API Endpoints Tested
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `POST /api/verify-email` - Email verification
- `POST /api/forgot-password` - Password reset request
- `POST /api/reset-password` - Password reset
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `POST /api/change-password` - Change password
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/logout` - User logout

### Test Endpoints (Testing Only)
- `POST /api/test/verify-user` - Programmatically verify user
- `POST /api/test/set-user-role` - Set user role
- `POST /api/test/get-verification-token` - Get verification token
- `POST /api/test/get-reset-token` - Get reset token
- `POST /api/test/clear-database` - Clear database

## Test Scenarios

### Positive Test Cases
- ✅ Successful user registration
- ✅ Successful login with valid credentials
- ✅ Email verification with valid token
- ✅ Password reset with valid token
- ✅ Profile updates
- ✅ Admin role management
- ✅ Complete user workflows

### Negative Test Cases
- ❌ Registration with invalid data
- ❌ Login with wrong credentials
- ❌ Access without authentication
- ❌ Admin actions by non-admin users
- ❌ Invalid tokens and expired tokens
- ❌ Rate limiting violations
- ❌ SQL injection attempts

### Edge Cases
- 🔄 Concurrent requests
- 🔄 Database connection issues
- 🔄 Malformed JSON requests
- 🔄 Missing environment variables
- 🔄 Token expiration handling

## Test Data

### Test Users
```javascript
// Regular user
{
  username: 'testuser',
  email: 'test@example.com',
  password: 'password', // bcrypt hash: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
  role: 'user',
  is_verified: true
}

// Admin user
{
  username: 'adminuser',
  email: 'admin@example.com',
  password: 'password',
  role: 'admin',
  is_verified: true
}
```

### Test Tokens
- Verification tokens: `test-verification-token-123`
- Reset tokens: `test-reset-token-123`
- JWT tokens: Generated during login

## Assertions Used

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### Response Validation
- Response body structure
- Error message content
- Database state changes
- Token generation and validation
- Security header presence

## Best Practices

### Test Isolation
- Each test runs in isolation
- Database is cleared before each test
- No shared state between tests

### Test Data Management
- Use dedicated test credentials
- Clean up after each test
- Avoid hardcoded values

### Error Testing
- Test both success and failure cases
- Validate error messages
- Check appropriate HTTP status codes

### Security Testing
- Test authentication requirements
- Validate authorization rules
- Check for common vulnerabilities

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure SQLite is properly configured
   - Check file permissions for database file

2. **JWT Secret Issues**
   - Verify JWT_SECRET is set in environment
   - Check token expiration settings

3. **Rate Limiting in Tests**
   - Tests may hit rate limits if run too quickly
   - Use `NODE_ENV=test` to disable rate limiting

4. **Email Configuration**
   - Email sending is disabled in test mode
   - Check SMTP configuration for production tests

### Debug Mode

Run tests with verbose output:
```bash
npx mocha --reporter spec test/*.test.js
```

Run single test:
```bash
npx mocha --grep "should register a new user successfully" test/backend.test.js
```

## Continuous Integration

The tests are designed to run in CI/CD pipelines:
- No external dependencies
- Fast execution
- Reliable results
- Clear error reporting

Add to your CI pipeline:
```yaml
- name: Run Backend Tests
  run: npm run test:all
``` 