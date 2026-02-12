# Architecture Explanation

Assessment.is is a diagnostic interview tool for healthcare professionals. It combines recorded video interviews with structured questionnaires (DIVA-2 for ADHD, GAD-7 for anxiety, etc) and produces reports automatically.

## Layered Architecture

The codebase separates concerns into four layers, each a top-level directory:

**domain/** — Pure business logic. No side effects, no HTTP, no framework dependencies. Defines interfaces (Effect Tags) that infrastructure implements. This is where clinical data models, repository interfaces, and business rules live.

**infrastructure/** — Concrete implementations of domain interfaces. Talks to external services (Google Cloud Healthcare API, Firebase, Daily.co). Provides Effect Layers that satisfy domain Tags.

**apps/** — User-facing applications that compose domain + infrastructure. The frontend is a React Router v7 SPA; the backend is Firebase Cloud Functions. Apps wire layers together but contain no business logic.

**global/** — Project-agnostic shared utilities. ESLint/Prettier/TypeScript configs, React components, and general-purpose helpers. Should be immediately copy-pastable to an unrelated project.

## Platform Service Architecture

The frontend uses a two-level context hierarchy for dependency injection:

```plaintext
PlatformContextProvider (root)
├── AuthDataService         # Authentication state
├── OrgService              # Organization selection
├── UserService             # User data and roles
├── FhirR4ClientService     # FHIR client
├── ClinicalDataRepositoryService
└── VideoCallClientService
    │
    └── OrgContextProvider (child)
        └── Selected org context for route components
```

`PlatformContextProvider` initializes all core services using Effect Layers. Services use `PubSub` + `Stream` for reactive state. Route components access services via `usePlatformContext()`.

## DocumentStore Abstraction

`DocumentStore` (in `platform-domain/tagClasses/`) abstracts document operations:

```typescript
interface DocumentStore {
  get(...path: string[]) => Effect<DocumentData, NotFoundError | UnhandledError>
  subscribeTo(...path: string[]) => Stream<Either<DocumentData, NotFoundError>>
}
```

- **Browser**: `FirebaseWebDocumentStoreLayer` (Firestore SDK)
- **Server**: `FirebaseAdminDocumentStoreLayer` (Admin SDK)

Both implement the same interface, enabling shared domain logic between client and server.

## Key Technology Choices

- **Effect-TS** for all async operations, dependency injection, and error handling
- **FHIR R4** for all clinical data structures (strict compliance required)
- **React Router v7** in SPA mode (no SSR) with file-based routing
- **Tundra CSS** + CSS Modules for styling
- **Firebase** for auth, hosting, and Cloud Functions
- **Daily.co** for video conferencing

## See Also

- [Architecture Reference](./Reference.md) — Package inventory and dependency rules
- [Effect Patterns Reference](../Effect/Patterns%20Reference.md) — Effect-TS conventions used here
- [Platform Services Explanation](../../domain/platform-domain/Platform%20Domain%20Explanation.md) — Auth, authorization, and org context details
