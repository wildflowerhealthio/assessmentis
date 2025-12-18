# @assessmentis/ontology

> 📖 **See [CONTRIBUTING.md](../../CONTRIBUTING.md) for general development guidelines common to all packages.**

## Overview

This package provides core domain errors and ontology types used across all Assessment.is packages. It defines the foundational error types that represent common failure modes in the application.

## What This Package Does

- Define domain-specific error types
- Provide structured error handling primitives
- Offer consistent error semantics across packages

## Error Types

### UnhandledError

Wraps unexpected errors that occur during execution, preserving the original error's stack trace and context.

```typescript
import { UnhandledError } from '@assessmentis/ontology'

throw new UnhandledError({ 
  cause: originalError, 
  message: 'Failed to process request' 
})
```

### ExternalAssertionError

Represents failures when interacting with external systems that don't behave as expected.

```typescript
import { ExternalAssertionError } from '@assessmentis/ontology'

throw new ExternalAssertionError({ 
  cause: error, 
  expected: 'Expected 200 OK response' 
})
```

### NotFoundError

Indicates that a requested resource could not be found.

```typescript
import { NotFoundError } from '@assessmentis/ontology'

throw new NotFoundError({ 
  resourceType: 'Questionnaire', 
  params: { id: questionnaireId } 
})
```

### NeedsAuthenticationError

Signals that authentication is required to perform an operation.

```typescript
import { NeedsAuthenticationError } from '@assessmentis/ontology'

throw new NeedsAuthenticationError({ cause: error })
```

## Usage

```typescript
import { UnhandledError, NotFoundError } from '@assessmentis/ontology'
import { Effect } from 'effect'

const getResource = (id: string): Effect.Effect<Resource, NotFoundError | UnhandledError> =>
  Effect.gen(function* () {
    try {
      const resource = yield* fetchResource(id)
      if (!resource) {
        return yield* Effect.fail(new NotFoundError({ 
          resourceType: 'Resource', 
          params: { id } 
        }))
      }
      return resource
    } catch (error) {
      return yield* Effect.fail(new UnhandledError({ cause: error }))
    }
  })
```

## Important Guidelines

### ✅ DO:

- Use these error types consistently across all packages
- Preserve original error information in the `cause` field
- Provide clear, actionable error messages
- Use type-safe error handling with Effect

### ❌ DON'T:

- Create new error types that duplicate these semantics
- Lose error context when wrapping errors
- Use plain JavaScript errors for domain failures
- Ignore error causes

## Related Packages

- All domain packages depend on this for error handling
- Infrastructure packages use these errors to communicate failures
- Application packages handle these errors for user feedback
