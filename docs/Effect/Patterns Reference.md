# Effect Patterns Reference

Effect-TS conventions used in this codebase. For architectural context, see [Architecture Explanation](../Architecture/Explanation.md).

## Repository Pattern

Domain defines the interface as an Effect Tag. Infrastructure provides the Layer.

```typescript
// Domain: interface only
export class PatientRepository extends Context.Tag('PatientRepository')<
  PatientRepository,
  {
    get: (id: PatientId) => Effect.Effect<Patient, NotFoundError | UnhandledError, never>
    getMany: (
      filter?: object
    ) => Effect.Effect<ReadonlyArray<WithId<Patient>>, UnhandledError, never>
    create: (patient: Patient) => Effect.Effect<Patient, UnhandledError, never>
    update: (patient: WithId<Patient>) => Effect.Effect<Patient, UnhandledError, never>
    delete: (id: PatientId) => Effect.Effect<void, UnhandledError, never>
  }
>() {}
```

## Effect Generators

Use generator syntax for composition:

```typescript
export const createEncounter = (args: CreateEncounterArg) =>
  Effect.gen(function* () {
    const repo = yield* EncounterRepository
    return yield* repo.create(args)
  })
```

## Error Wrappers

Define specific error classes to enable targeted handling at boundaries:

```typescript
export class QuestionnaireNotFoundError extends Data.TaggedError('QuestionnaireNotFoundError')<{
  questionnaireId: string
  cause?: unknown
}> {}

// Handle at boundary
Effect.catchTag('QuestionnaireNotFoundError', (e) =>
  Effect.fail(
    new NotFoundError({
      resourceType: 'Questionnaire',
      params: { id: e.questionnaireId },
    })
  )
)
```

Platform-domain defines two auth errors:

- `AuthError` — user is not authenticated
- `AuthzError` — user lacks required permissions (authenticated but not authorized)

## Layer Composition

Infrastructure provides Layers that satisfy domain Tags:

```typescript
export const PatientRepositoryLive = Layer.effect(
  PatientRepository,
  Effect.gen(function* () {
    const fhirClient = yield* FhirR4ClientService
    return {
      get: (id) =>
        Effect.gen(function* () {
          /* implementation */
        }),
      // ...
    }
  })
)
```

Compose layers in apps:

```typescript
const MainLayer = Layer.mergeAll(PatientRepositoryLive, EncounterRepositoryLive).pipe(
  Layer.provide(FhirClientLive)
)
```

## Schema Patterns

Use Effect Schema for FHIR resources with branded ID types:

```typescript
export const PatientId = Schema.String.pipe(Schema.brand('PatientId'))
export const Patient = Schema.Struct({
  resourceType: Schema.Literal('Patient'),
  id: Schema.optional(PatientId),
  // ...
})
export type Patient = typeof Patient.Type
```

## See Also

- [Layer Implementation How-To](../../infrastructure/Layer%20Implementation%20How-To.md) — Creating new Layer implementations
- [Platform Domain Explanation](../../domain/platform-domain/Platform%20Domain%20Explanation.md) — Auth, authorization, and context tags
