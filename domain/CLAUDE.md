# domain/ - Pure Business Logic

This directory contains domain packages with pure business logic and types. See [../CLAUDE.md](../CLAUDE.md) for general project guidance.

## Domain Packages

- **clinical-domain/** - FHIR R4 resources and clinical data types
- **questionnaire-entities/** - Questionnaire templates and utilities
- **document-template-kinds/** - Document/report scoring and generation logic
- **platform-domain/** - User and configuration abstractions
- **config-domain/** - Configuration schemas
- **video-call-domain/** - Video call abstractions

## Critical Domain Rules

### MUST Keep Packages Pure

⚠️ **Absolutely NO side effects in domain packages**

❌ NO HTTP calls or API requests
❌ NO database queries
❌ NO file system access
❌ NO console.log or side effects
✅ Only pure functions and data transformations

### MUST Use Effect-TS

All business logic uses Effect-TS:

```typescript
import { Effect, Schema, Context, Data } from 'effect'

// Define data with Effect Schema
export const Patient = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  birthDate: Schema.DateFromString,
})

// Define repository interface as Effect Tag
export class PatientRepository extends Context.Tag('PatientRepository')<
  PatientRepository,
  {
    get: (
      id: string
    ) => Effect.Effect<
      typeof Patient.Type,
      PatientNotFoundError | UnhandledError
    >
  }
>() {}

// Business logic using Effect generators
export const getPatientAge = (patientId: string) =>
  Effect.gen(function* () {
    const repo = yield* PatientRepository
    const patient = yield* repo.get(patientId)
    const now = new Date()
    const age = now.getFullYear() - patient.birthDate.getFullYear()
    return age
  })
```

## FHIR R4 Compliance (clinical-domain)

⚠️ **NEVER modify FHIR resource schemas without domain expert review**

### Rules for FHIR Resources

1. **Follow spec exactly:** https://hl7.org/fhir/R4/
2. **Use Effect Schema** for compile-time and runtime validation
3. **Add round-trip property tests** for every FHIR resource
4. **Document purpose** in JSDoc comments

### Example FHIR Resource Schema

```typescript
import { Schema } from 'effect'
import { fc } from 'fast-check'

// Define FHIR resource following R4 spec
export const Encounter = Schema.Struct({
  resourceType: Schema.Literal('Encounter'),
  id: Schema.String,
  status: Schema.Literal(
    'planned',
    'arrived',
    'in-progress',
    'finished',
    'cancelled'
  ),
  class: Schema.Struct({
    system: Schema.String,
    code: Schema.String,
  }),
  subject: Schema.optional(
    Schema.Struct({
      reference: Schema.String,
    })
  ),
  // ... other FHIR fields
})

// Round-trip property test (REQUIRED)
it('Encounter should round-trip correctly', () => {
  fc.assert(
    fc.property(Schema.arbitrary(Encounter)(fc), (data) => {
      const encoded = Schema.encodeSync(Encounter)(data)
      const decoded = Schema.decodeSync(Encounter)(encoded)
      expect(decoded).toEqual(data)
    })
  )
})
```

## Platform-Domain Services

The `platform-domain` package provides authentication, authorization, and org-scoped data abstractions.

### AuthError vs AuthzError

Two distinct error types for different failure modes:

```typescript
import { Schema } from 'effect'

// Authentication error - user not logged in
export class AuthError extends Schema.TaggedClass<AuthError>()('AuthError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {
  static Unauthenticated = new AuthError({
    message: 'User is not authenticated',
  })
}

// Authorization error - user lacks permissions (but IS authenticated)
export class AuthzError extends Schema.TaggedClass<AuthzError>()('AuthzError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}
```

**When to use each:**

- `AuthError` → User session invalid/expired, redirect to login
- `AuthzError` → User authenticated but lacks role/permission, show "Access Denied"

### Context Tag Classes

Platform-domain defines abstract tags for dependency injection:

```typescript
// CurrentUserId - provides authenticated user context
export class CurrentUserId extends Context.Tag('CurrentUserId')<
  CurrentUserId,
  { userId: UserId; authToken: string }
>() {}

// CurrentOrg - provides org context for multi-tenant operations
export class CurrentOrg extends Context.Tag('CurrentOrg')<
  CurrentOrg,
  OrgSlug
>() {}

// DocumentStore - abstract data access layer
export class DocumentStore extends Context.Tag('DocumentStore')<
  DocumentStore,
  {
    get: (
      ...path: string[]
    ) => Effect.Effect<DocumentData, NotFoundError | UnhandledError>
    subscribeTo: (
      ...path: string[]
    ) => Stream.Stream<Either<DocumentData, NotFoundError>>
  }
>() {}
```

### LoadedOrg/LoadedUser Pattern

Pre-load and validate domain objects for downstream services:

```typescript
import { Context, Layer, Effect } from 'effect'
import {
  LoadedOrg,
  LoadedOrgLayer,
  LiteralLoadedOrgLayer,
} from '@assessmentis/platform-domain'

// LoadedOrg is a Context.Tag providing a validated Org object
export class LoadedOrg extends Context.Tag('LoadedOrg')<LoadedOrg, Org>() {}

// Two ways to create the layer:

// 1. From DocumentStore + CurrentOrg (production)
const prodLayer = LoadedOrgLayer // requires DocumentStore, CurrentOrg

// 2. From literal data (testing)
const testLayer = LiteralLoadedOrgLayer(orgSlug, mockOrgData)

// Use in downstream services
const myService = Effect.gen(function* () {
  const org = yield* LoadedOrg // Already validated Org object
  return org.name
})
```

### Role-Based Authorization

Use `OrgUserService` for permission checks:

```typescript
import {
  OrgUserService,
  OrgUserServiceLayer,
} from '@assessmentis/platform-domain'

const protectedOperation = Effect.gen(function* () {
  const orgUserService = yield* OrgUserService

  // Fails with AuthzError if user lacks role
  yield* orgUserService.ensureRole(['admin', 'clinician'])

  // User has required role, proceed with operation
  return yield* performSensitiveAction()
})
```

## Error Wrappers Pattern

Use unique error wrappers to distinguish failure modes:

```typescript
import { Data } from 'effect'

// Define specific error classes
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
      id: string
    ) => Effect.Effect<
      Questionnaire,
      QuestionnaireNotFoundError | UnhandledError
    >
  }
>() {}
```

**Why error wrappers?**

- Enable targeted error handling at application boundaries
- Make error flows explicit in type signatures
- Allow different recovery strategies for same underlying error

## Repository Pattern

Define interfaces in domain, implement in infrastructure:

```typescript
// domain/clinical-domain/src/repositories/PatientRepository.ts
export class PatientRepository extends Context.Tag('PatientRepository')<
  PatientRepository,
  {
    get: (
      id: PatientId
    ) => Effect.Effect<Patient, PatientNotFoundError | UnhandledError>
    create: (
      patient: Patient
    ) => Effect.Effect<Patient, ValidationError | UnhandledError>
  }
>() {}
```

Implementation lives in infrastructure packages (e.g., `google-fhir-web-infrastructure`).

## Testing Domain Logic

### Property-Based Tests First

Use fast-check with Effect Schema arbitraries:

```typescript
import { fc } from 'fast-check'
import { Schema } from 'effect'

const PatientArb = Schema.arbitrary(Patient)(fc)

it('should maintain age calculation invariant', () => {
  fc.assert(
    fc.property(PatientArb, (patient) => {
      const age = calculateAge(patient.birthDate)
      expect(age).toBeGreaterThanOrEqual(0)
      expect(age).toBeLessThan(150) // reasonable upper bound
    })
  )
})
```

### MECE Test Structure

Mutually Exclusive, Completely Exhaustive:

```typescript
describe('Encounter status transitions', () => {
  // Partition the domain completely
  describe('when status is planned', () => {
    /* ... */
  })
  describe('when status is arrived', () => {
    /* ... */
  })
  describe('when status is in-progress', () => {
    /* ... */
  })
  describe('when status is finished', () => {
    /* ... */
  })
  describe('when status is cancelled', () => {
    /* ... */
  })
})
```

## Creating a New Repository Interface

1. Create file in appropriate domain package
2. Define error classes for all failure modes
3. Define repository as Effect Tag with interface methods
4. Add JSDoc documentation
5. Export from package `src/index.ts`
6. Implementation goes in infrastructure package

## See Also

- [../TESTING.md](../TESTING.md) - Comprehensive testing patterns
- [../infrastructure/CLAUDE.md](../infrastructure/CLAUDE.md) - How to implement these interfaces
- [../CLAUDE.md](../CLAUDE.md) - Root project guidance
