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
npm run format         # Format all files with Prettier
```

## Code Style and Conventions

### TypeScript

- **Strict mode enabled**: All packages use TypeScript strict mode
- **Explicit parameter types**: Always type function parameters
- **Infer return types**: Let TypeScript infer return types when obvious
- **Use Effect Schema**: For runtime validation in domain/infrastructure packages

### Formatting

Prettier is configured globally:

- **No semicolons**
- **Single quotes**
- **2-space indentation**
- **Trailing commas** (ES5 style)

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

### Unit Tests

- Use **Vitest** for all packages
- Test files alongside source: `*.test.ts`
- Test both happy paths and edge cases

### Testing Patterns

```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should handle valid input', () => {
    const result = myFunction(validInput)
    expect(result).toBe(expectedOutput)
  })

  it('should handle invalid input', () => {
    expect(() => myFunction(invalidInput)).toThrow()
  })
})
```

### Property-Based Testing with fast-check

Use **property-based testing** to validate code against a wide range of inputs. Keep properties focused and concise.

```typescript
import { fc } from 'fast-check'
import { Schema } from 'effect'

// Effect Schemas can be used as fast-check arbitraries
const MySchemaArbitrary = Schema.arbitrary(MySchema)(fc)

it('should maintain property for all valid inputs', () => {
  fc.assert(
    fc.property(MySchemaArbitrary, (data) => {
      const result = myFunction(data)
      // Test a useful property (e.g., idempotence, invariant preservation)
      expect(myFunction(result)).toEqual(result)
    })
  )
})
```

**Guidelines for property-based testing:**

- Focus on **useful properties**: idempotence, reversibility, invariants
- Keep tests **concise** - one property per test
- Use Effect Schemas as arbitraries with `Schema.arbitrary(MySchema)(fc)`
- Test edge cases explicitly, use property tests for general behavior

### Schema Testing

Schema tests validate both encoding/decoding and serve as property-based tests:

```typescript
import { Schema } from 'effect'
import { fc } from 'fast-check'

it('should encode and decode correctly', () => {
  const encoded = Schema.encodeSync(MySchema)(data)
  const decoded = Schema.decodeSync(MySchema)(encoded)
  expect(decoded).toEqual(data)
})

// Property-based test using schema as arbitrary
it('should round-trip for all valid data', () => {
  fc.assert(
    fc.property(Schema.arbitrary(MySchema)(fc), (data) => {
      const decoded = Schema.decodeSync(MySchema)(
        Schema.encodeSync(MySchema)(data)
      )
      expect(decoded).toEqual(data)
    })
  )
})
```

## Package-Specific Guidelines

### Domain Packages

**Purpose**: Pure business logic, types, and repository interfaces

✅ **DO**:

- Use Effect-TS for all business logic
- Define repository interfaces as Effect Tags
- Use Effect Schema for data validation
- Keep packages pure (no side effects)
- Write comprehensive tests

❌ **DON'T**:

- Add infrastructure implementations
- Make HTTP calls or database queries

### Infrastructure Packages

**Purpose**: Concrete implementations of domain interfaces

✅ **DO**:

- Implement repository interfaces from domain packages
- Use Effect Layers for dependency injection
- Handle external API calls
- Provide service implementations
- Most infrastructure should be accessed through interfaces defined in the domain

❌ **DON'T**:

- Add business logic (belongs in domain)
- Add UI components
- Duplicate domain logic
- Manage configuration (belongs in domain packages)

### App Packages

**Purpose**: End-user applications

✅ **DO**:

- Compose domain and infrastructure layers
- Handle user interaction
- Manage routing and navigation
- Integrate with external services

❌ **DON'T**:

- Duplicate logic from domain packages
- Bypass domain repositories
- Add domain models (use domain packages)

### Global Packages

**Purpose**: Project and domain agnostic shared configurations and utilities

✅ **DO**:

- Keep utilities project and domain agnostic -- This folder should be immediately copy-pastable to an entirely no project, in a different area
- Provide reusable configurations
- Document usage clearly

❌ **DON'T**:

- Add business logic
- Add application-specific code

## Effect-TS Patterns

This project follows specific Effect-TS conventions. These are patterns that have emerged in this codebase.

### Error Wrappers

This project uses **unique error wrappers** to distinguish between different failure modes, even when the underlying error is the same type. This allows for more precise error handling at boundaries.

**Why we use error wrappers:**

- Enable targeted error handling at application boundaries
- Make error flows explicit in type signatures
- Allow different recovery strategies for the same underlying error type

```typescript
// Define specific error wrappers
export class QuestionnaireNotFoundError extends Data.TaggedError(
  'QuestionnaireNotFoundError'
)<{
  questionnaireId: string
  cause?: unknown
}> {}

export class UnhandledError extends Data.TaggedError('UnhandledError')<{
  cause?: unknown
}> {}

// Use in repository interfaces
export class QuestionnaireRepository extends Context.Tag(
  'QuestionnaireRepository'
)<
  QuestionnaireRepository,
  {
    get: (
      id: QuestionnaireId
    ) => Effect.Effect<
      Questionnaire,
      QuestionnaireNotFoundError | UnhandledError,
      never
    >
  }
>() {}
```

### Repository Pattern

Define interfaces in domain packages, implement in infrastructure:

```typescript
// Domain: interface only
export class MyRepository extends Context.Tag('MyRepository')<
  MyRepository,
  {
    get: (id: Id) => Effect.Effect<Data, NotFoundError | UnhandledError, never>
  }
>() {}

// Infrastructure: concrete implementation
export const MyRepositoryLive = Layer.effect(
  MyRepository,
  Effect.gen(function* () {
    const config = yield* ConfigService
    return {
      get: (id) =>
        Effect.gen(function* () {
          // Implementation
        }),
    }
  })
)
```

### Effect Generators

Use generator syntax for Effect composition:

```typescript
export const myOperation = (arg: Arg) =>
  Effect.gen(function* () {
    const repo = yield* MyRepository
    const data = yield* repo.get(arg.id)
    return transform(data)
  })
```

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

- Check package-specific README files for detailed guidelines
- Review `copilot-instructions.md` for architecture details
- Consult FHIR R4 specification for clinical data models

## Summary

- **Domain packages**: Pure logic, types, interfaces
- **Infrastructure packages**: Implementations, external integrations
- **Use Effect-TS**: For composable, type-safe operations
- **Test thoroughly**: Unit tests for all logic
- **Follow conventions**: TypeScript, Prettier, ESLint configurations
- **Keep it clean**: Minimal dependencies, clear separation of concerns
