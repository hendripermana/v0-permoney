# Code Review Guidelines

## Overview

Code reviews are essential for maintaining code quality, sharing knowledge, and ensuring consistency
across the Permoney codebase. This document establishes guidelines for both authors and reviewers to
make the review process effective and constructive.

## Code Review Principles

### Core Values

- **Quality**: Ensure code meets our standards and requirements
- **Learning**: Share knowledge and improve team skills
- **Collaboration**: Foster positive team communication
- **Security**: Identify potential security vulnerabilities
- **Performance**: Consider performance implications
- **Maintainability**: Ensure code is readable and maintainable

### Review Mindset

**For Authors:**

- Be open to feedback and suggestions
- Provide context and explanation for complex changes
- Respond promptly to review comments
- Keep PRs focused and reasonably sized

**For Reviewers:**

- Be constructive and respectful in feedback
- Focus on the code, not the person
- Explain the "why" behind suggestions
- Acknowledge good practices and improvements

## Pull Request Requirements

### Before Submitting a PR

**Author Checklist:**

- [ ] Code follows project coding standards
- [ ] All tests pass locally
- [ ] New functionality has appropriate tests
- [ ] Documentation updated if needed
- [ ] Self-review completed
- [ ] PR description is clear and complete
- [ ] Related issues are referenced
- [ ] Breaking changes are documented
- [ ] Security implications considered

### PR Size Guidelines

**Ideal PR Size:**

- **Small**: < 200 lines changed (preferred)
- **Medium**: 200-500 lines changed (acceptable)
- **Large**: > 500 lines changed (requires justification)

**When Large PRs are Acceptable:**

- Initial feature scaffolding
- Generated code (migrations, schemas)
- Bulk refactoring with automated tools
- Documentation updates

**Breaking Down Large PRs:**

\`\`\`
Instead of:
❌ feat(budget): implement complete budget system (1200 lines)

Break into:
✅ feat(budget): add budget data models and migrations (150 lines)
✅ feat(budget): implement budget service layer (200 lines)
✅ feat(budget): add budget API endpoints (180 lines)
✅ feat(budget): create budget UI components (220 lines)
✅ feat(budget): integrate budget system with dashboard (150 lines)
\`\`\`

## Review Process

### Review Timeline

- **Initial Review**: Within 24 hours during business days
- **Follow-up Reviews**: Within 4 hours during business days
- **Urgent/Hotfix Reviews**: Within 2 hours

### Review Stages

#### 1. Automated Checks

Before human review, ensure all automated checks pass:

- CI/CD pipeline tests
- Linting and formatting
- Type checking
- Security scanning
- Build verification

#### 2. Code Review

Human reviewers focus on:

- Logic and algorithm correctness
- Code quality and standards
- Architecture and design patterns
- Security considerations
- Performance implications
- Test coverage and quality

#### 3. Approval and Merge

- Required approvals based on branch protection rules
- Final automated checks before merge
- Merge strategy execution

## Review Checklist

### Functionality Review

**Logic and Correctness:**

- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled appropriately
- [ ] Error conditions are managed properly
- [ ] Business logic is correct and complete

**Integration:**

- [ ] New code integrates well with existing systems
- [ ] APIs are used correctly
- [ ] Database interactions are proper
- [ ] External service calls are handled correctly

### Code Quality Review

**Readability:**

- [ ] Code is self-documenting and clear
- [ ] Variable and function names are descriptive
- [ ] Complex logic is commented appropriately
- [ ] Code structure is logical and organized

**Standards Compliance:**

- [ ] Follows project coding standards
- [ ] Naming conventions are consistent
- [ ] File organization follows project structure
- [ ] Import statements are organized correctly

**TypeScript Specific:**

- [ ] Types are properly defined and used
- [ ] No `any` types without justification
- [ ] Interfaces and types are reusable
- [ ] Generic types are used appropriately

### Security Review

**Input Validation:**

- [ ] User inputs are validated and sanitized
- [ ] SQL injection prevention measures in place
- [ ] XSS prevention implemented
- [ ] CSRF protection where applicable

**Authentication & Authorization:**

- [ ] Proper authentication checks
- [ ] Authorization rules enforced
- [ ] Sensitive data is protected
- [ ] Session management is secure

**Data Protection:**

- [ ] Sensitive data is encrypted
- [ ] Logging doesn't expose sensitive information
- [ ] API responses don't leak internal data
- [ ] File uploads are properly validated

### Performance Review

**Database Performance:**

- [ ] Queries are optimized
- [ ] Proper indexing is used
- [ ] N+1 query problems avoided
- [ ] Connection pooling considered

**Frontend Performance:**

- [ ] Components are optimized (React.memo, useMemo)
- [ ] Large lists are virtualized if needed
- [ ] Images are optimized
- [ ] Bundle size impact considered

**API Performance:**

- [ ] Response times are reasonable
- [ ] Caching strategies implemented
- [ ] Rate limiting considered
- [ ] Pagination for large datasets

### Testing Review

**Test Coverage:**

- [ ] New functionality has appropriate tests
- [ ] Edge cases are tested
- [ ] Error conditions are tested
- [ ] Integration points are tested

**Test Quality:**

- [ ] Tests are readable and maintainable
- [ ] Test data is realistic
- [ ] Mocks are used appropriately
- [ ] Tests are deterministic and reliable

## Review Comments Guidelines

### Comment Types

**Blocking Issues (Must Fix):**

\`\`\`
🚨 BLOCKING: This creates a security vulnerability
🚨 BLOCKING: This will cause a runtime error
🚨 BLOCKING: This violates our coding standards
\`\`\`

**Suggestions (Should Consider):**

\`\`\`
💡 SUGGESTION: Consider using a more descriptive variable name
💡 SUGGESTION: This could be extracted into a reusable utility
💡 SUGGESTION: Consider adding error handling here
\`\`\`

**Questions (Needs Clarification):**

\`\`\`
❓ QUESTION: Why was this approach chosen over X?
❓ QUESTION: Is this handling the edge case where Y happens?
❓ QUESTION: Should this be configurable?
\`\`\`

**Praise (Acknowledge Good Work):**

\`\`\`
👍 NICE: Great use of TypeScript generics here
👍 NICE: This error handling is very thorough
👍 NICE: Excellent test coverage
\`\`\`

### Comment Examples

#### Good Review Comments

\`\`\`typescript
// ❌ Poor comment
// This is wrong

// ✅ Good comment
// 🚨 BLOCKING: This function doesn't handle the case where `user` is null,
// which can happen when the session expires. Consider adding a null check
// or using optional chaining.

// ❌ Poor comment
// Use better names

// ✅ Good comment
// 💡 SUGGESTION: Consider using more descriptive names like `isTransactionValid`
// instead of `isValid` to make the code more self-documenting.

// ❌ Poor comment
// Add tests

// ✅ Good comment
// 💡 SUGGESTION: This function handles several edge cases that would benefit
// from unit tests, particularly the currency conversion logic and error handling.
\`\`\`

#### Constructive Feedback Examples

\`\`\`typescript
// Instead of: "This is inefficient"
// Say: "💡 SUGGESTION: This loop could be optimized using Array.reduce()
// or consider if this operation could be moved to the database level for better performance."

// Instead of: "Wrong pattern"
// Say: "💡 SUGGESTION: Consider using the Repository pattern here to maintain
// consistency with our data access layer architecture."

// Instead of: "Bad naming"
// Say: "💡 SUGGESTION: The name `data` is quite generic. Consider something
// more specific like `transactionData` or `userInput` to improve readability."
\`\`\`

## Common Review Scenarios

### New Feature Review

**Focus Areas:**

- Requirements fulfillment
- Integration with existing features
- User experience considerations
- Performance impact
- Security implications
- Test coverage

**Example Review Flow:**

\`\`\`typescript
// 1. Verify feature requirements
❓ QUESTION: Does this implementation handle the multi-currency requirement
mentioned in the spec?

// 2. Check integration points
💡 SUGGESTION: Consider how this interacts with the existing budget system.
Should budget allocations be updated when transactions are categorized?

// 3. Review user experience
👍 NICE: The loading states and error handling provide great user feedback.

// 4. Performance considerations
💡 SUGGESTION: This query might be expensive with large datasets. Consider
adding pagination or implementing it as a background job.
\`\`\`

### Bug Fix Review

**Focus Areas:**

- Root cause understanding
- Fix completeness
- Regression prevention
- Test coverage for the bug

**Example Review Flow:**

\`\`\`typescript
// 1. Understand the root cause
❓ QUESTION: What was causing the currency conversion to fail? Was it a
rounding issue or missing exchange rate data?

// 2. Verify fix completeness
💡 SUGGESTION: This fixes the immediate issue, but should we also add
validation to prevent invalid exchange rates from being stored?

// 3. Prevent regressions
💡 SUGGESTION: Consider adding a test case that reproduces the original
bug to prevent regression.
\`\`\`

### Refactoring Review

**Focus Areas:**

- Code improvement without behavior change
- Maintainability enhancement
- Performance impact
- Breaking changes

**Example Review Flow:**

\`\`\`typescript
// 1. Verify no behavior changes
✅ VERIFIED: Confirmed that the refactored function produces the same
outputs for the same inputs.

// 2. Check maintainability improvement
👍 NICE: Extracting this logic into separate functions makes it much
more readable and testable.

// 3. Consider performance impact
❓ QUESTION: Does the new abstraction layer introduce any performance
overhead we should be aware of?
\`\`\`

## Review Response Guidelines

### For Authors

**Responding to Comments:**

- Address each comment individually
- Explain your reasoning when disagreeing
- Ask for clarification when comments are unclear
- Thank reviewers for their time and feedback

**Response Examples:**

\`\`\`
// Accepting suggestion
"Great point! I've updated the variable name to be more descriptive."

// Explaining reasoning
"I chose this approach because it handles the edge case where the API
returns null values, which the suggested alternative doesn't cover.
However, I'm open to other suggestions."

// Asking for clarification
"Could you elaborate on the security concern? I'm not seeing how this
could be exploited."

// Disagreeing respectfully
"I understand the concern about performance, but based on our current
data volumes and the fact that this runs only once per user session,
I think the current approach is acceptable. Happy to revisit if we
see performance issues in monitoring."
\`\`\`

### For Reviewers

**Following Up:**

- Acknowledge when concerns are addressed
- Re-review promptly after changes
- Approve when satisfied with changes
- Escalate if disagreements can't be resolved

## Review Tools and Automation

### GitHub Review Features

**Using Review Tools Effectively:**

- Use line comments for specific issues
- Use general comments for overall feedback
- Use suggestions for simple fixes
- Request changes vs. approve appropriately

**Review Status Guidelines:**

- **Request Changes**: For blocking issues that must be fixed
- **Approve**: When code meets standards and requirements
- **Comment**: For non-blocking suggestions and questions

### Automated Review Tools

**Code Quality Tools:**

- ESLint for code standards
- Prettier for formatting
- TypeScript compiler for type checking
- SonarQube for code quality metrics

**Security Tools:**

- Snyk for dependency vulnerabilities
- CodeQL for security analysis
- OWASP ZAP for security testing

## Review Metrics and Improvement

### Tracking Review Effectiveness

**Metrics to Monitor:**

- Average review time
- Number of review iterations
- Defect escape rate
- Review participation rate

**Continuous Improvement:**

- Regular retrospectives on review process
- Feedback collection from team members
- Process adjustments based on metrics
- Training and knowledge sharing sessions

### Review Quality Indicators

**Good Review Indicators:**

- Constructive feedback provided
- Security and performance considered
- Knowledge sharing occurs
- Code quality improves

**Poor Review Indicators:**

- Rubber stamp approvals
- Nitpicking without value
- Delayed or missing reviews
- Repeated issues in similar code

## Escalation Process

### When to Escalate

- Disagreement on technical approach
- Security concerns not addressed
- Performance issues not resolved
- Repeated violations of coding standards

### Escalation Steps

1. **Direct Discussion**: Try to resolve through comments
2. **Synchronous Discussion**: Schedule a call or meeting
3. **Team Lead Involvement**: Bring in technical lead
4. **Architecture Review**: Escalate to architecture team
5. **Final Decision**: CTO or senior technical leadership

## Training and Onboarding

### New Team Member Review Training

**Week 1-2: Observer**

- Shadow experienced reviewers
- Read review comments and discussions
- Ask questions about review decisions

**Week 3-4: Guided Reviews**

- Conduct reviews with mentor oversight
- Receive feedback on review quality
- Learn team-specific patterns and preferences

**Week 5+: Independent Reviews**

- Conduct independent reviews
- Participate in review discussions
- Contribute to review process improvements

### Ongoing Education

- Monthly review best practices sessions
- Sharing of interesting review findings
- Discussion of new tools and techniques
- Cross-team review collaboration

This comprehensive code review process ensures high-quality code, effective knowledge sharing, and
continuous team improvement while maintaining development velocity.
