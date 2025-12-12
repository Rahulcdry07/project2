# Testing Checklist - Mandatory Before Commit

**⚠️ ALL tests must pass before committing any code changes**

Last Updated: December 13, 2025

## Quick Test Commands

### Run All Tests (Required Before Commit)
```bash
npm run test:verify
```
This runs both backend and frontend tests and verifies everything passes.

### Individual Test Suites
```bash
# Backend tests (172 tests)
npm run test:unit

# Frontend tests (177 tests)  
npm run test:frontend

# Specific backend test files
npm run test:models        # 19 tests
npm run test:controllers   # 30 tests
npm run test:tenders       # 28 tests
npm run test:middleware    # 21 tests
npm run test:utils         # 24 tests
npm run test:security-unit # 18 tests
npm run test:backend       # 32 integration tests
```

## Pre-Commit Automated Checks

When you run `git commit`, the following checks run automatically:

1. ✅ **Linting** - ESLint checks on staged files
2. ✅ **Backend Tests** - All 172 backend tests must pass
3. ✅ **Frontend Tests** - All 177 frontend tests must pass

**If any check fails, the commit will be blocked.**

## Manual Testing Checklist

### For Any Code Change
- [ ] Run `npm run test:verify` and ensure all 349 tests pass
- [ ] Run `npm run lint` and fix any linting errors
- [ ] Review changed files for console.logs or debug code
- [ ] Check that no sensitive data is exposed

### For Backend Changes

#### Model Changes
- [ ] Run `npm run test:models` - 19 tests must pass
- [ ] Verify database migrations work
- [ ] Check foreign key constraints
- [ ] Test cascade deletes if applicable

#### Controller Changes  
- [ ] Run `npm run test:controllers` - 30 tests must pass
- [ ] Test error handling for all endpoints
- [ ] Verify authentication/authorization
- [ ] Check input validation

#### API Endpoint Changes
- [ ] Run `npm run test:backend` - 32 integration tests must pass
- [ ] Test all HTTP methods (GET, POST, PUT, DELETE)
- [ ] Verify response formats match documentation
- [ ] Test error responses (400, 401, 403, 404, 500)

#### Tender Feature Changes
- [ ] Run `npm run test:tenders` - 28 tests must pass
- [ ] Test all CRUD operations
- [ ] Verify admin-only access control
- [ ] Test filtering and search functionality
- [ ] Check data validation (title, description, category)

#### Middleware Changes
- [ ] Run `npm run test:middleware` - 21 tests must pass
- [ ] Test authentication flow
- [ ] Verify admin role checks
- [ ] Check security middleware

#### Utility Changes
- [ ] Run `npm run test:utils` - 24 tests must pass
- [ ] Test error handling
- [ ] Verify logging functionality

### For Frontend Changes

#### Component Changes
- [ ] Run `npm run test:frontend` - 177 tests must pass
- [ ] Test component rendering
- [ ] Verify user interactions (clicks, input)
- [ ] Test loading states
- [ ] Test error states
- [ ] Check empty states

#### Tender Component Changes
- [ ] Test TenderList filtering (7 tests)
- [ ] Test TenderDetail display (7 tests)  
- [ ] Test TenderManagement admin features (6 tests)
- [ ] Test TenderRecommendations (7 tests)
- [ ] Verify tenderAPI service (6 tests)

#### Hook Changes
- [ ] Test hook return values
- [ ] Test hook side effects
- [ ] Verify cleanup functions
- [ ] Test edge cases

#### API Service Changes
- [ ] Test all API methods
- [ ] Verify error handling
- [ ] Check request/response transformations
- [ ] Test authentication headers

## Test Coverage Requirements

### Minimum Coverage Standards
- **Backend**: 100% of all tests passing (172/172)
- **Frontend**: 100% of all tests passing (177/177)
- **Total**: 349/349 tests passing

### Coverage by Category
| Category | Tests | Requirement |
|----------|-------|-------------|
| Models | 19 | 100% passing |
| Controllers | 30 | 100% passing |
| Tender API | 28 | 100% passing |
| Middleware | 21 | 100% passing |
| Utilities | 24 | 100% passing |
| Security | 18 | 100% passing |
| Integration | 32 | 100% passing |
| Frontend Components | 90+ | 100% passing |
| Frontend Hooks | 40+ | 100% passing |
| Frontend Services | 40+ | 100% passing |

## Adding New Features

When adding new features, you must:

1. **Write tests FIRST** (TDD approach)
2. **Achieve 100% test coverage** for new code
3. **Ensure all existing tests still pass**
4. **Update this checklist** if needed

### New Feature Test Requirements

#### Backend Feature
- [ ] Model tests (if adding/modifying models)
- [ ] Controller tests for business logic
- [ ] Integration tests for API endpoints
- [ ] Validation tests for input data
- [ ] Error handling tests
- [ ] Authorization tests (if applicable)

#### Frontend Feature
- [ ] Component rendering tests
- [ ] User interaction tests
- [ ] API integration tests
- [ ] Error state tests
- [ ] Loading state tests
- [ ] Empty state tests

## Common Test Failures

### Backend Test Issues
- **Foreign Key Errors**: Check cascade deletes in models
- **Authentication Errors**: Verify JWT token generation
- **Validation Errors**: Check model validators match test data
- **Database Errors**: Ensure test database is properly cleaned

### Frontend Test Issues
- **Multiple Elements**: Use `getAllByText()[0]` or `queryByText`
- **Async Errors**: Always use `await waitFor()` for async operations
- **Mock Issues**: Verify mock data structure matches API responses
- **Router Issues**: Ensure `useParams` and `useNavigate` are mocked

## Test Debugging

### Backend Debug Commands
```bash
# Run specific test file with verbose output
NODE_ENV=test npx mocha test/tenders.test.js --timeout 10000

# Run single test
NODE_ENV=test npx mocha test/tenders.test.js --grep "should create a new tender"
```

### Frontend Debug Commands
```bash
cd public/dashboard-app

# Run tests in watch mode
npm test

# Run specific test file
npm test TenderList

# Run with verbose output
npm test -- --reporter=verbose
```

## Security Checks

Before committing, verify:
- [ ] No hardcoded credentials
- [ ] No API keys in code
- [ ] No sensitive data in console.logs
- [ ] Input validation is present
- [ ] Authentication is enforced
- [ ] Authorization is checked

## Performance Checks

For significant changes:
- [ ] Test with realistic data volumes
- [ ] Check database query performance
- [ ] Verify API response times
- [ ] Test frontend rendering performance

## Documentation Updates

When changing features:
- [ ] Update API documentation
- [ ] Update README if needed
- [ ] Update test coverage report
- [ ] Add inline code comments
- [ ] Update CHANGELOG

## Commit Message Guidelines

After all tests pass:
```
feat(tenders): add filtering by status

- Added status filter to tender list
- Updated TenderList component
- Added 3 new tests for status filtering
- All 349 tests passing

Tests: ✅ 349/349 passing
```

## Bypass Protection (Emergency Only)

**⚠️ NEVER bypass tests in normal circumstances**

If absolutely necessary (deployment emergency):
```bash
git commit --no-verify -m "emergency fix: description"
```

**Must create follow-up ticket to:**
1. Fix the bypassed tests
2. Add tests for the emergency fix
3. Document why bypass was necessary

## Test Statistics

Current test coverage (as of December 13, 2025):
- **Total Tests**: 349
- **Passing**: 349 (100%)
- **Failing**: 0
- **Backend**: 172 tests (100% passing)
- **Frontend**: 177 tests (100% passing)
- **Test Execution Time**: ~10 seconds

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook)
- Every push (if CI/CD configured)
- Every pull request

## Support

If tests fail and you need help:
1. Read the error message carefully
2. Check this checklist for common issues
3. Run tests in verbose mode
4. Check recent commits for similar changes
5. Ask team for help with context

---

**Remember: Breaking tests means breaking production. Test thoroughly!** ✅
