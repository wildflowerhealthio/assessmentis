# infrastructure/ - Implementation Packages

This directory contains concrete implementations of domain interfaces. See [../CLAUDE.md](../CLAUDE.md) for general project guidance.

## Infrastructure Packages

### Web (Browser) Infrastructure
- **google-fhir-web-infrastructure/** - Google Cloud Healthcare API client (FHIR store)
- **firebase-web-infrastructure/** - Firebase Auth and Firestore client (browser)
- **daily-co-infrastructure/** - Daily.co video integration
- **document-template-instances/** - React document templates
- **google-meet-infrastructure/** - (Currently unused)

### Server (Node.js) Infrastructure
- **firebase-server-infrastructure/** - Firebase Admin SDK for Cloud Functions
- **google-fhir-node-infrastructure/** - Node.js FHIR client (placeholder)

## Infrastructure Guidelines

### What Infrastructure Should Do

✅ Implement repository interfaces from domain packages
✅ Use Effect Layers for dependency injection
✅ Handle external API calls (Google Cloud, Daily.co, Firebase)
✅ Provide service implementations
✅ Manage API credentials and configuration

### What Infrastructure Should NOT Do

❌ Add business logic (belongs in domain)
❌ Add UI components (belongs in apps)
❌ Duplicate domain logic
❌ Define domain models (use domain packages)

## Effect Layer Pattern

Infrastructure packages provide Layer implementations of domain interfaces:

```typescript
// infrastructure/google-fhir-web-infrastructure/src/PatientRepositoryLive.ts
import { Layer, Effect } from 'effect'
import { PatientRepository } from '@assessmentis/clinical-domain'

export const PatientRepositoryLive = Layer.effect(
  PatientRepository,
  Effect.gen(function* () {
    // Get dependencies from context
    const config = yield* ConfigService
    const httpClient = yield* HttpClient

    return PatientRepository.of({
      get: (id) =>
        Effect.gen(function* () {
          // Implementation using external API
          const response = yield* httpClient.get(
            `${config.fhirStoreUrl}/Patient/${id}`
          )

          // Map errors to domain errors
          if (response.status === 404) {
            return yield* Effect.fail(
              new PatientNotFoundError({ patientId: id })
            )
          }

          // Decode and validate with Effect Schema
          return yield* Schema.decodeUnknown(Patient)(response.data)
        }),
    })
  })
)
```

## Dependency Injection with Layers

Compose layers to provide all dependencies:

```typescript
// apps/functions/src/index.ts
import { Layer } from 'effect'
import { PatientRepositoryLive } from '@assessmentis/google-fhir-web-infrastructure'
import { ConfigServiceLive } from '@assessmentis/firebase-web-infrastructure'

// Compose all infrastructure layers
const InfrastructureLayer = Layer.mergeAll(
  ConfigServiceLive,
  PatientRepositoryLive
  // ... other layers
)

// Provide to Effect program
const program = Effect.gen(function* () {
  const patientRepo = yield* PatientRepository
  // Use repository
}).pipe(Effect.provide(InfrastructureLayer))
```

## Error Handling at Infrastructure Boundaries

Map external API errors to domain errors:

```typescript
import { Effect, Match } from 'effect'

const mapApiError = (error: ApiError) =>
  Match.value(error.status).pipe(
    Match.when(
      404,
      () =>
        new ResourceNotFoundError({
          /* ... */
        })
    ),
    Match.when(
      403,
      () =>
        new UnauthorizedError({
          /* ... */
        })
    ),
    Match.orElse(() => new UnhandledError({ cause: error }))
  )

// In repository implementation
yield * apiCall.pipe(Effect.mapError(mapApiError))
```

## External API Client Patterns

### Google Cloud Healthcare API

```typescript
import { google } from 'googleapis'

const healthcare = google.healthcare({ version: 'v1', auth })

// FHIR operations
await healthcare.projects.locations.datasets.fhirStores.fhir.read({
  name: `projects/${projectId}/locations/${location}/datasets/${datasetId}/fhirStores/${fhirStoreId}/fhir/Patient/${patientId}`,
})
```

### Daily.co API

```typescript
// Create Daily.co room
const response = await fetch('https://api.daily.co/v1/rooms', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    properties: {
      enable_recording: 'cloud',
      // ... other properties
    },
  }),
})
```

### Firebase (Auth, Firestore)

```typescript
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// Firestore operations with Effect
const getDocument = (collection: string, id: string) =>
  Effect.tryPromise({
    try: () => getDoc(doc(db, collection, id)),
    catch: (error) => new UnhandledError({ cause: error }),
  })
```

## Creating a New Layer Implementation

1. Create package under `infrastructure/`
2. Import repository interface from domain package
3. Create `*Live.ts` file for Layer implementation
4. Use `Layer.effect` to create the layer
5. Implement all interface methods
6. Map external errors to domain errors
7. Add integration tests
8. Export layer from package `src/index.ts`

Example structure:

```
infrastructure/
  my-service-infrastructure/
    src/
      MyRepositoryLive.ts      # Layer implementation
      client.ts                # External API client
      mappers.ts               # Data mappers (external ↔ domain)
      errors.ts                # Error mapping utilities
      index.ts                 # Barrel export
    package.json
    tsconfig.json
```

## Testing Infrastructure

- **Unit tests:** Test error mapping and data transformation logic
- **Integration tests:** Test against real external APIs (use emulators when available)
- **Mock external APIs:** Use Effect's `Layer.succeed` for testing

```typescript
// Mock layer for testing
export const PatientRepositoryMock = Layer.succeed(
  PatientRepository,
  PatientRepository.of({
    get: (id) => Effect.succeed(mockPatient),
  })
)
```

## Configuration Management

Use Effect Config for type-safe configuration:

```typescript
import { Config } from 'effect'

const FhirStoreConfig = Config.all({
  projectId: Config.string('FHIR_PROJECT_ID'),
  location: Config.string('FHIR_LOCATION'),
  datasetId: Config.string('FHIR_DATASET_ID'),
  storeId: Config.string('FHIR_STORE_ID'),
})

// Use in Layer
export const ConfigServiceLive = Layer.effect(
  ConfigService,
  Effect.gen(function* () {
    const config = yield* FhirStoreConfig
    return ConfigService.of(config)
  })
)
```

## Server-Side Infrastructure (firebase-server-infrastructure)

The `firebase-server-infrastructure` package provides Firebase Admin SDK implementations for Cloud Functions.

### FirebaseAdmin Service

Singleton service providing Firebase Admin SDK access:

```typescript
import { Effect } from 'effect'
import { FirebaseAdmin } from '@assessmentis/firebase-server-infrastructure'

const myFunction = Effect.gen(function* () {
  const { app, auth, firestore } = yield* FirebaseAdmin
  // Use admin SDK
  const user = yield* Effect.tryPromise(() => auth.getUser(userId))
  return user
})

// FirebaseAdmin.Default provides the layer
myFunction.pipe(Effect.provide(FirebaseAdmin.Default))
```

### FirebaseAdminDocumentStoreLayer

Server-side implementation of the `DocumentStore` interface from `platform-domain`:

```typescript
import { Layer } from 'effect'
import { FirebaseAdminDocumentStoreLayer } from '@assessmentis/firebase-server-infrastructure'
import { DocumentStore } from '@assessmentis/platform-domain'

// Use in Cloud Functions
const ServerLayer = FirebaseAdminDocumentStoreLayer

const readOrg = Effect.gen(function* () {
  const store = yield* DocumentStore
  const data = yield* store.get('orgs', 'my-org-slug')
  return data
}).pipe(Effect.provide(ServerLayer))
```

### AuthRepository

OAuth token storage for server-side operations:

```typescript
import { AuthRepository } from '@assessmentis/firebase-server-infrastructure'

const refreshTokens = Effect.gen(function* () {
  const authRepo = yield* AuthRepository
  const refreshToken = yield* authRepo.getRefreshToken(userId)
  // Use refresh token to get new access token
}).pipe(Effect.provide(AuthRepository.Default))
```

## Server-Side Layer Composition

Compose server infrastructure layers for Cloud Functions:

```typescript
import { Layer } from 'effect'
import {
  FirebaseAdmin,
  FirebaseAdminDocumentStoreLayer,
  AuthRepository,
} from '@assessmentis/firebase-server-infrastructure'
import {
  LoadedOrgLayer,
  LoadedUserLayer,
  OrgUserServiceLayer,
} from '@assessmentis/platform-domain'

// Base server layer
const BaseServerLayer = Layer.mergeAll(
  FirebaseAdmin.Default,
  FirebaseAdminDocumentStoreLayer,
  AuthRepository.Default
)

// Add domain layers on top
const FullServerLayer = Layer.provideMerge(
  Layer.mergeAll(LoadedOrgLayer, LoadedUserLayer, OrgUserServiceLayer),
  BaseServerLayer
)

// Use in Cloud Function
export const myCloudFunction = functions.https.onCall(async (data, context) => {
  const program = Effect.gen(function* () {
    // All layers available
    const org = yield* LoadedOrg
    yield* (yield* OrgUserService).ensureRole(['admin'])
    // ...
  })

  return Effect.runPromise(
    program.pipe(
      Effect.provide(FullServerLayer),
      Effect.provideService(CurrentUserId, { userId, authToken }),
      Effect.provideService(CurrentOrg, orgSlug)
    )
  )
})
```

## See Also

- [../domain/CLAUDE.md](../domain/CLAUDE.md) - Repository interfaces to implement
- [../CLAUDE.md](../CLAUDE.md) - Root project guidance
- [../CONTRIBUTING.md](../CONTRIBUTING.md) - Full contribution guidelines
