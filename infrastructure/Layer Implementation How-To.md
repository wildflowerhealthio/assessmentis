# Layer Implementation How-To

How to create Effect Layer implementations of domain interfaces. For pattern reference, see [Effect Patterns Reference](../docs/Effect/Patterns%20Reference.md).

## Create the Layer

Implement a domain Tag by providing a Layer:

```typescript
import { Layer, Effect } from 'effect'
import { PatientRepository } from '@assessmentis/clinical-domain/patients'

export const PatientRepositoryLive = Layer.effect(
  PatientRepository,
  Effect.gen(function* () {
    const fhirClient = yield* FhirR4ClientService
    return {
      get: (id) => fhirClient.read('Patient', id),
      getMany: (filter) => fhirClient.search('Patient', filter),
      create: (patient) => fhirClient.create('Patient', patient),
      update: (patient) => fhirClient.update('Patient', patient),
      delete: (id) => fhirClient.delete('Patient', id),
    }
  })
)
```

## Map Errors at Boundaries

External APIs produce their own error types. Map them to domain errors:

```typescript
import { Match } from 'effect'

const mapApiError = Match.type<ApiError>().pipe(
  Match.when({ status: 404 }, (e) => new NotFoundError({ cause: e })),
  Match.when({ status: 401 }, (e) => new AuthError({ cause: e })),
  Match.orElse((e) => new UnhandledError({ cause: e }))
)
```

Apply in repository methods:

```typescript
get: (id) => fhirClient.read('Patient', id).pipe(
  Effect.mapError(mapApiError)
)
```

## Server-Side Layers

Cloud Functions use `firebase-server-infrastructure` which provides:

- **`FirebaseAdminService`** — Firebase Admin SDK instance
- **`FirebaseAdminDocumentStoreLayer`** — `DocumentStore` implementation via Admin SDK
- **`AuthRepository`** — user authentication verification

Compose for a Cloud Function:

```typescript
const ServerLayer = Layer.mergeAll(
  PatientRepositoryLive,
  FirebaseAdminDocumentStoreLayer,
).pipe(Layer.provide(FirebaseAdminService.Live))
```

## Testing Layers

- **Unit tests**: Test error mapping logic directly
- **Integration tests**: Use `@assessmentis/testing-utils/vcr-js` to record/replay HTTP interactions
- **Mock layers**: Provide test implementations for domain Tags in component/integration tests

## Steps for a New Layer

1. Create package in `infrastructure/` (or add to existing)
2. Import the domain Tag you're implementing
3. Write the Layer using `Layer.effect(Tag, Effect.gen(...))`
4. Map all external errors to domain error types
5. Export the Layer
6. Add integration tests with VCR if the layer talks to external APIs

## See Also

- [Effect Patterns Reference](../docs/Effect/Patterns%20Reference.md) — Repository, generator, and error patterns
- [Architecture Explanation](../docs/Architecture/Explanation.md) — Why the domain/infrastructure split exists
