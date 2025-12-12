# Git Branch Strategy

This project follows **Git Flow** best practices for branch management.

## Branch Structure

### Main Branch

- **`main`** - Production-ready code
  - Protected branch
  - All commits must pass pre-commit hooks (349 tests + linting)
  - Represents stable, deployable code
  - Direct commits NOT allowed (except for hotfixes)

## Development Workflow

### 1. Feature Development

```bash
# Create a new feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Work on your feature
# Commit changes regularly with conventional commits

# Push feature branch
git push origin feature/your-feature-name

# Create Pull Request to main
```

### 2. Bug Fixes

```bash
# Create a bugfix branch from main
git checkout main
git pull origin main
git checkout -b fix/bug-description

# Fix the bug and commit
# Push and create PR
git push origin fix/bug-description
```

### 3. Hotfixes (Production Issues)

```bash
# Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-issue

# Fix and merge directly to main after testing
git checkout main
git merge --no-ff hotfix/critical-issue
git push origin main
git branch -d hotfix/critical-issue
```

## Branch Naming Conventions

Follow these naming patterns:

- **Features:** `feature/description` or `feature/issue-number-description`
  - Example: `feature/user-authentication`
  - Example: `feature/123-add-payment-gateway`

- **Bug Fixes:** `fix/description` or `fix/issue-number-description`
  - Example: `fix/login-validation`
  - Example: `fix/456-memory-leak`

- **Hotfixes:** `hotfix/description`
  - Example: `hotfix/security-patch`

- **Chores:** `chore/description`
  - Example: `chore/update-dependencies`

- **Documentation:** `docs/description`
  - Example: `docs/api-endpoints`

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**

```bash
git commit -m "feat(auth): add JWT token refresh mechanism"
git commit -m "fix(api): resolve null pointer in user controller"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(tender): add integration tests for CRUD operations"
```

## Pre-Commit Enforcement

All commits are automatically validated with:

- ✅ ESLint (backend + frontend)
- ✅ 172 backend tests
- ✅ 177 frontend tests

**Total: 349 tests must pass before commit is allowed**

## Pull Request Guidelines

### Before Creating a PR:

1. Ensure your branch is up to date with `main`
2. Run tests locally: `npm run test:verify`
3. Check linting: `npm run lint`
4. Update documentation if needed

### PR Template:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Feature
- [ ] Bug fix
- [ ] Hotfix
- [ ] Documentation
- [ ] Refactoring

## Testing

- [ ] All 349 tests pass
- [ ] New tests added (if applicable)
- [ ] Manual testing completed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Branch Cleanup

### Delete Merged Branches

```bash
# Delete local merged branches
git branch --merged main | grep -v "main" | xargs git branch -d

# Delete remote branch after merge
git push origin --delete feature/branch-name
```

### Prune Stale References

```bash
git remote prune origin
```

## Protected Branch Rules (GitHub Settings)

Configure on GitHub:

### Main Branch Protection:

- ✅ Require pull request reviews (minimum 1 approval)
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators
- ✅ Require linear history
- ✅ Do not allow bypassing the above settings

## Quick Reference

```bash
# Start new feature
git checkout -b feature/my-feature

# Keep branch updated
git fetch origin
git rebase origin/main

# Push for PR
git push origin feature/my-feature

# After PR merge, cleanup
git checkout main
git pull origin main
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

## Current Branch Status

- **Active Branches:** `main` only
- **Stale Branches:** None (all cleaned up)
- **Test Coverage:** 349/349 tests (100%)
- **Pre-commit Hook:** ✅ Active and enforced

---

**Last Updated:** December 13, 2025
