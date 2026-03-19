# Contributing to Assessment.is

This guide covers general development practices for all packages in the Assessment.is monorepo.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Common Commands](#common-commands)
- [Code Style and Conventions](#code-style-and-conventions)
- [Testing Guidelines](#testing-guidelines)
- [Package-Specific Guidelines](#package-specific-guidelines)

## Development Setup

### Prerequisites

- Node.js 22.x
- npm 10.9.2 or higher
- Understanding of TypeScript
- Familiarity with Effect-TS (for domain and infrastructure packages)
- Knowledge of FHIR R4 (for clinical packages)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/ruthmarks151/assessmentis.git
cd assessmentis

# Install dependencies
npm install
```

## Project Structure

This is a Turborepo monorepo organized into:

- **`apps/`**: Applications (frontend, functions)
- **`domain/`**: Domain logic and types (pure business logic)
- **`infrastructure/`**: Infrastructure implementations (API clients, services)
- **`global/`**: Shared configurations and utilities

## Common Commands

All packages support these standard commands:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Testing
npm run test

# Building
npm run build

# Development (apps only)
npm run dev
```

### Root-Level Commands

Run commands across all packages:

```bash
npm run typecheck    # Type check all packages
npm run lint           # Lint all packages
npm run test           # Test all packages
npm run build          # Build all packages
npm run format         # Format all files with Oxfmt
```

## Code Style and Conventions

### TypeScript

- **Strict mode enabled**: All packages use TypeScript strict mode
- **Explicit parameter types**: Always type function parameters
- **Infer return types**: Let TypeScript infer return types when obvious
- **Use Effect Schema**: For runtime validation in domain/infrastructure packages

### Formatting

Oxfmt is configured globally via `.oxfmtrc.json`:

- **No semicolons**
- **Single quotes**
- **2-space indentation**
- **Trailing commas** (ES5 style)
- **100-character print width**
- **Import sorting** enabled
- **package.json sorting** enabled

Run `npm run format` to format all files.

### Naming Conventions

- **PascalCase**: Types, interfaces, classes, React components, Effect Tags
- **camelCase**: Variables, functions, properties
- **PascalCase for files**: Component files (`NavHeader.tsx`)
- **camelCase for files**: Utility files (`clientRuntime.tsx`)

### Import Organization

Order imports as follows:

1. React and React-related libraries
2. Third-party libraries
3. Effect-TS imports
4. Domain imports (`@assessmentis/*-domain`)
5. Infrastructure imports (`@assessmentis/*-infrastructure`)
6. Local utility imports
7. Relative imports
8. Type imports (if using `import type`)

## Testing Guidelines

For comprehensive testing documentation, see [docs/Testing/](./docs/Testing/Testing%20Reference.md).

- [Unit Testing How-To](./docs/Testing/Unit%20Testing%20How-To.md) — Case-based tests, Effect patterns, FHIR schemas
- [Property Testing Reference](./docs/Testing/Property%20Testing%20Reference.md) — Arbitraries, verified mocks, MECE assertions
- [React Testing Reference](./docs/Testing/React%20Testing%20Reference.md) — Components, hooks, mocking
- [Integration Testing How-To](./docs/Testing/Integration%20Testing%20How-To.md) — VCR-style HTTP record/integration

### Quick Summary

- Use **Vitest** for all packages
- Test files alongside source: `*.test.ts`
- **Property-based testing first** with `fast-check` and `Arbitrary.make(Schema)`
- Use `@assessmentis/testing-utils/vcr-js` for HTTP record/playback in integration testing against external APIs

## Package-Specific Guidelines

See [Architecture Reference](./docs/Architecture/Reference.md) for the full package inventory and dependency rules between layers.

Each layer directory has its own AGENTS.md with specific rules. In brief:

- **domain/**: Pure business logic. No side effects. Define interfaces as Effect Tags.
- **infrastructure/**: Implement domain interfaces via Effect Layers. Map external errors to domain errors.
- **apps/**: Compose domain + infrastructure. No business logic.
- **global/**: Project-agnostic utilities. Immediately copy-pastable to another project.

## Effect-TS Patterns

See [Effect Patterns Reference](./docs/Effect/Patterns%20Reference.md) for repository pattern, generators, error wrappers, and Layer composition.

## Dependency Management

### Adding Dependencies

1. Run `npm install <package>` in the specific package directory
2. Use workspace references (`*`) for internal dependencies
3. Keep dependencies minimal
4. Avoid version conflicts across packages

### Peer Dependencies

For shared libraries (React, etc.), use peer dependencies:

```json
{
  "peerDependencies": {
    "react": "^19.2.0"
  }
}
```

## Git Workflow

1. Create a feature branch
2. Make focused, incremental changes
3. Write descriptive commit messages
4. Run `npm run lint` and `npm run typecheck` before committing
5. Open a pull request
6. Address review feedback

## CI/CD

All PRs run:

- **Linting**: ESLint on all packages
- **Type checking**: TypeScript compilation
- **Tests**: Vitest test suites

Ensure all checks pass before merging.

## Questions?

- Check package-specific AGENTS.md files for layer-specific guidelines
- See [Architecture Explanation](./docs/Architecture/Explanation.md) for architecture details
- Consult FHIR R4 specification for clinical data models

## Summary

- **Domain packages**: Pure logic, types, interfaces
- **Infrastructure packages**: Implementations, external integrations
- **Use Effect-TS**: For composable, type-safe operations
- **Test thoroughly**: Unit tests for all logic
- **Follow conventions**: TypeScript, Oxfmt, ESLint configurations
- **Keep it clean**: Minimal dependencies, clear separation of concerns
