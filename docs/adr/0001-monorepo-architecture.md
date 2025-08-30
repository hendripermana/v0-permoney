# ADR-0001: Monorepo Architecture with Nx

## Status

Accepted

## Context

The Permoney Enterprise Redesign requires a scalable, maintainable project structure that can
support multiple applications (frontend, backend, mobile in the future) while sharing common code,
configurations, and development workflows. We need to decide on the project organization strategy
that will facilitate code sharing, consistent tooling, and efficient development processes.

## Decision

We will use Nx-powered monorepo architecture to organize the Permoney codebase, containing frontend
(Next.js), backend (NestJS), and shared libraries within a single repository.

## Rationale

- **Code Sharing**: Enables sharing of TypeScript types, utilities, and business logic between
  frontend and backend
- **Consistent Tooling**: Unified linting, testing, and build configurations across all applications
- **Dependency Management**: Single package.json reduces dependency conflicts and simplifies updates
- **Developer Experience**: Simplified setup and onboarding for new developers
- **CI/CD Efficiency**: Single repository enables better caching and incremental builds
- **Atomic Changes**: Changes affecting multiple applications can be made in a single commit

## Alternatives Considered

### Alternative 1: Multi-repo (Separate repositories)

- **Description**: Separate repositories for frontend, backend, and shared libraries
- **Pros**: Clear separation of concerns, independent deployment cycles, team autonomy
- **Cons**: Complex dependency management, code duplication, difficult cross-cutting changes
- **Why rejected**: Overhead of maintaining multiple repositories outweighs benefits for our team
  size

### Alternative 2: Simple monorepo without Nx

- **Description**: Single repository with manual organization and tooling
- **Pros**: Simpler setup, no additional framework dependency
- **Cons**: Manual configuration management, no built-in optimization, scaling challenges
- **Why rejected**: Lacks sophisticated tooling needed for efficient development at scale

### Alternative 3: Lerna-based monorepo

- **Description**: Using Lerna for monorepo management
- **Pros**: Mature ecosystem, good for library publishing
- **Cons**: Less integrated development experience, primarily focused on package publishing
- **Why rejected**: Nx provides better integrated development experience for applications

## Consequences

### Positive

- Simplified development workflow with shared tooling
- Efficient code sharing between applications
- Better caching and build optimization through Nx
- Consistent code quality through shared configurations
- Easier refactoring across application boundaries

### Negative

- Learning curve for developers unfamiliar with Nx
- Potential for tighter coupling between applications
- Larger repository size and clone times
- Need for careful dependency management to avoid circular dependencies

### Neutral

- All team members need to understand the monorepo structure
- CI/CD pipelines need to be configured for monorepo workflows
- Deployment strategies need to account for multiple applications

## Implementation Notes

1. Initialize Nx workspace with Next.js and NestJS presets
2. Create shared libraries for:
   - Common TypeScript types (`libs/shared/types`)
   - Utility functions (`libs/shared/utils`)
   - Database schemas (`libs/shared/schemas`)
   - API contracts (`libs/shared/api`)
3. Configure workspace-level ESLint, Prettier, and TypeScript configurations
4. Set up project-specific configurations where needed
5. Implement affected-based testing and building in CI/CD

## References

- [Nx Documentation](https://nx.dev/)
- [Monorepo Best Practices](https://monorepo.tools/)
- [Requirements 1.1, 1.2, 1.3](../specs/permoney-enterprise-redesign/requirements.md)

## Metadata

- **Date**: 2025-01-08
- **Author(s)**: Development Team
- **Reviewers**: Technical Lead
- **Related Requirements**: 1.1, 1.2, 1.3
