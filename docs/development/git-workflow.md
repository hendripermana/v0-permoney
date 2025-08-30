# Git Branching Strategy & Workflow

## Overview

This document defines the Git branching strategy, commit message format, and workflow processes for
the Permoney project to ensure consistent collaboration and maintainable version control.

## Branching Strategy

We follow a **Git Flow** inspired strategy with simplified branch types optimized for continuous
deployment.

### Branch Types

#### Main Branches

\`\`\`
main (production)
├── develop (integration)
├── staging (pre-production testing)
\`\`\`

**main**

- Always production-ready code
- Protected branch requiring PR reviews
- Automatic deployment to production
- Only accepts merges from `staging` or hotfix branches

**develop**

- Integration branch for ongoing development
- All feature branches merge here first
- Continuous integration testing
- Automatic deployment to development environment

**staging**

- Pre-production testing branch
- Merges from `develop` for release preparation
- Manual and automated testing
- Deployment to staging environment

#### Supporting Branches

**Feature Branches**

\`\`\`
feature/task-description
feature/user-authentication
feature/transaction-management
feature/budget-system
\`\`\`

**Bugfix Branches**

\`\`\`
bugfix/issue-description
bugfix/transaction-validation-error
bugfix/currency-conversion-bug
\`\`\`

**Hotfix Branches**

\`\`\`
hotfix/critical-issue-description
hotfix/security-vulnerability-fix
hotfix/data-corruption-fix
\`\`\`

**Release Branches**

\`\`\`
release/v1.2.0
release/v2.0.0-beta
\`\`\`

### Branch Naming Conventions

\`\`\`bash
# Feature branches
feature/short-descriptive-name
feature/implement-debt-management
feature/add-islamic-finance-support

# Bugfix branches
bugfix/short-descriptive-name
bugfix/fix-currency-conversion
bugfix/resolve-authentication-timeout

# Hotfix branches
hotfix/critical-issue-name
hotfix/fix-data-leak
hotfix/patch-security-vulnerability

# Release branches
release/version-number
release/v1.0.0
release/v2.1.0-beta
\`\`\`

## Workflow Process

### Feature Development Workflow

\`\`\`bash
# 1. Create and switch to feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/implement-budget-system

# 2. Work on feature with regular commits
git add .
git commit -m "feat(budget): add budget creation endpoint"

# 3. Keep feature branch updated with develop
git checkout develop
git pull origin develop
git checkout feature/implement-budget-system
git rebase develop

# 4. Push feature branch
git push origin feature/implement-budget-system

# 5. Create Pull Request to develop
# 6. After review and approval, merge to develop
# 7. Delete feature branch
git branch -d feature/implement-budget-system
git push origin --delete feature/implement-budget-system
\`\`\`

### Release Workflow

\`\`\`bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Finalize release (version bumps, changelog, etc.)
git commit -m "chore(release): prepare v1.2.0"

# 3. Merge to staging for testing
git checkout staging
git merge release/v1.2.0
git push origin staging

# 4. After testing, merge to main
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags

# 5. Merge back to develop
git checkout develop
git merge release/v1.2.0
git push origin develop

# 6. Delete release branch
git branch -d release/v1.2.0
git push origin --delete release/v1.2.0
\`\`\`

### Hotfix Workflow

\`\`\`bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-critical-security-issue

# 2. Fix the issue
git commit -m "fix(security): patch authentication vulnerability"

# 3. Merge to main immediately
git checkout main
git merge hotfix/fix-critical-security-issue
git tag v1.2.1
git push origin main --tags

# 4. Merge to develop and staging
git checkout develop
git merge hotfix/fix-critical-security-issue
git push origin develop

git checkout staging
git merge hotfix/fix-critical-security-issue
git push origin staging

# 5. Delete hotfix branch
git branch -d hotfix/fix-critical-security-issue
git push origin --delete hotfix/fix-critical-security-issue
\`\`\`

## Commit Message Format

We follow the **Conventional Commits** specification for consistent and semantic commit messages.

### Format Structure

\`\`\`
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
\`\`\`

### Commit Types

| Type       | Description                           | Example                                               |
| ---------- | ------------------------------------- | ----------------------------------------------------- |
| `feat`     | New feature                           | `feat(auth): add passkey authentication`              |
| `fix`      | Bug fix                               | `fix(transaction): resolve currency conversion error` |
| `docs`     | Documentation changes                 | `docs(api): update authentication endpoints`          |
| `style`    | Code style changes (formatting, etc.) | `style(components): fix eslint warnings`              |
| `refactor` | Code refactoring                      | `refactor(services): extract common validation logic` |
| `perf`     | Performance improvements              | `perf(queries): optimize transaction search query`    |
| `test`     | Adding or updating tests              | `test(auth): add unit tests for login service`        |
| `chore`    | Maintenance tasks                     | `chore(deps): update dependencies to latest versions` |
| `ci`       | CI/CD changes                         | `ci(github): add automated testing workflow`          |
| `build`    | Build system changes                  | `build(docker): optimize container image size`        |
| `revert`   | Revert previous commit                | `revert: feat(auth): add passkey authentication`      |

### Scope Examples

\`\`\`
feat(auth): add biometric authentication
fix(transaction): resolve duplicate entry bug
docs(api): update GraphQL schema documentation
test(budget): add integration tests for budget service
chore(database): add migration for new user fields
perf(dashboard): optimize net worth calculation query
\`\`\`

### Commit Message Examples

#### Good Examples

\`\`\`bash
# Simple feature addition
feat(wishlist): add price tracking for e-commerce items

# Bug fix with scope
fix(currency): handle missing exchange rate gracefully

# Breaking change
feat(api)!: redesign authentication endpoints

BREAKING CHANGE: The authentication API has been redesigned.
The /login endpoint now returns a different response format.

# Detailed commit with body
feat(budget): implement envelope budgeting system

Add comprehensive envelope budgeting with:
- Category-based budget allocation
- Real-time spending tracking
- Overspend alerts and notifications
- Carry-over functionality for unused budgets

Closes #123, #124
\`\`\`

#### Bad Examples

\`\`\`bash
# Too vague
fix: bug fix

# No type
add new feature for users

# Inconsistent capitalization
Fix: Currency Conversion Bug

# Too long description
feat(transaction): add the ability to create, edit, delete and manage transactions with support for multiple currencies and automatic categorization
\`\`\`

### Commit Message Rules

1. **Use imperative mood**: "add feature" not "added feature"
2. **Capitalize first letter**: "Add feature" not "add feature"
3. **No period at end**: "Add feature" not "Add feature."
4. **Limit first line to 72 characters**
5. **Use body for detailed explanation when needed**
6. **Reference issues/PRs in footer**: "Closes #123"

## Pull Request Guidelines

### PR Title Format

Follow the same format as commit messages:

\`\`\`
feat(auth): implement WebAuthn passkey authentication
fix(transaction): resolve currency conversion rounding error
docs(readme): update installation instructions
\`\`\`

### PR Description Template

\`\`\`markdown
## Description

Brief description of changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as
      expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] New tests added for new functionality

## Screenshots (if applicable)

Add screenshots for UI changes.

## Checklist

- [ ] Code follows project coding standards
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)
- [ ] Tests added/updated
- [ ] All CI checks pass

## Related Issues

Closes #123 Relates to #456
\`\`\`

### PR Review Process

1. **Author Responsibilities**:
   - Ensure all CI checks pass
   - Provide clear description and context
   - Respond to review feedback promptly
   - Keep PR scope focused and small

2. **Reviewer Responsibilities**:
   - Review within 24 hours during business days
   - Provide constructive feedback
   - Test functionality when applicable
   - Approve only when confident in changes

3. **Review Criteria**:
   - Code quality and standards compliance
   - Test coverage and quality
   - Security considerations
   - Performance impact
   - Documentation completeness

## Branch Protection Rules

### Main Branch Protection

\`\`\`yaml
# GitHub branch protection settings
main:
  required_status_checks:
    strict: true
    contexts:
      - 'ci/tests'
      - 'ci/lint'
      - 'ci/type-check'
      - 'ci/security-scan'
  enforce_admins: true
  required_pull_request_reviews:
    required_approving_review_count: 2
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
  restrictions:
    users: []
    teams: ['core-developers']
\`\`\`

### Develop Branch Protection

\`\`\`yaml
develop:
  required_status_checks:
    strict: true
    contexts:
      - 'ci/tests'
      - 'ci/lint'
      - 'ci/type-check'
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
\`\`\`

## Git Hooks

### Pre-commit Hook

\`\`\`bash
#!/bin/sh
# .husky/pre-commit

# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm run test:unit

# Check commit message format (handled by commitlint)
\`\`\`

### Commit Message Hook

\`\`\`bash
#!/bin/sh
# .husky/commit-msg

# Validate commit message format
npx commitlint --edit $1
\`\`\`

### Pre-push Hook

\`\`\`bash
#!/bin/sh
# .husky/pre-push

# Run full test suite
npm run test

# Run build to ensure no build errors
npm run build
\`\`\`

## Merge Strategies

### Feature Branches → Develop

- **Strategy**: Squash and merge
- **Reason**: Clean history, single commit per feature

### Develop → Staging

- **Strategy**: Merge commit
- **Reason**: Preserve feature branch history for testing

### Staging → Main

- **Strategy**: Merge commit
- **Reason**: Preserve release history and traceability

### Hotfix → Main

- **Strategy**: Merge commit
- **Reason**: Clear identification of hotfix in history

## Release Management

### Version Numbering

Follow **Semantic Versioning (SemVer)**:

\`\`\`
MAJOR.MINOR.PATCH

1.0.0 - Initial release
1.1.0 - New features, backward compatible
1.1.1 - Bug fixes, backward compatible
2.0.0 - Breaking changes
\`\`\`

### Release Notes Format

\`\`\`markdown
# Release v1.2.0

## 🚀 New Features

- feat(budget): Add envelope budgeting system (#123)
- feat(wishlist): Implement price tracking (#124)

## 🐛 Bug Fixes

- fix(currency): Handle missing exchange rates (#125)
- fix(auth): Resolve session timeout issues (#126)

## 📚 Documentation

- docs(api): Update GraphQL schema documentation (#127)

## 🔧 Maintenance

- chore(deps): Update dependencies to latest versions (#128)

## Breaking Changes

None in this release.

## Migration Guide

No migration required for this release.
\`\`\`

## Troubleshooting Common Issues

### Merge Conflicts

\`\`\`bash
# When rebasing feature branch
git checkout feature/my-feature
git rebase develop

# Resolve conflicts in files
# Then continue rebase
git add .
git rebase --continue

# Force push after rebase (only for feature branches)
git push --force-with-lease origin feature/my-feature
\`\`\`

### Accidental Commits to Wrong Branch

\`\`\`bash
# Move commits to correct branch
git log --oneline -n 5  # Find commit hash
git checkout correct-branch
git cherry-pick <commit-hash>

# Remove from wrong branch
git checkout wrong-branch
git reset --hard HEAD~1  # Remove last commit
\`\`\`

### Large File Handling

\`\`\`bash
# Use Git LFS for large files
git lfs track "*.pdf"
git lfs track "*.png"
git add .gitattributes
git commit -m "chore: add Git LFS tracking for large files"
\`\`\`

This Git workflow ensures consistent collaboration, maintainable history, and reliable deployments
while supporting the team's development velocity.
