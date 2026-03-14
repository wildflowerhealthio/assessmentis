# Hub Integration Explanation

This document explains how the effectful-store Hub replaces `ClinicalDataRepositoryService` in the frontend and how it fits into the platform service graph.

For background on the Hub's internal design, see [Hub Design Explanation](../../../../global/effectful-store/docs/Hub%20Design%20Explanation.md).

## What Changes

The Hub is a single routing layer that all clinical data consumers call directly. Each external data source (FHIR, Daily.co, etc.) registers a source behaviour with the Hub. Consumers call `hub.get()`, `hub.search()`, `hub.create()`, etc., passing the `domainType` as a parameter, and the Hub routes to the appropriate source internally.

```plaintext
CredentialService → Source Behaviours (FhirR4, DailyCo, etc.) → Hub (single instance, all resource types)
```

## Wiring in PlatformContextProvider

The Hub is created once during platform initialization and added to `PlatformContext`. Source registration is driven by reactive streams (org changes, auth state), not static configuration.

Sketch of the wiring:

```typescript
const hub = yield * makeHub<ClinicalResources>()

// FHIR source lifecycle driven by org stream
yield *
  orgStream.pipe(
    StreamEither.tapRight((org) =>
      Effect.gen(function* () {
        yield* hub.removeSource(previousFhirOrigin)
        yield* hub.addSource(
          FhirR4SourceBehaviour({
            clientStream: buildClientStream(org),
            origin: orgFhirOrigin(org),
            provokeReauth: authService.provokeReauth,
          })
        )
      })
    ),
    Stream.runDrain,
    Effect.forkScoped
  )
```

Key points:

- The Hub instance is stable. It is created once and passed through context. Org switches don't replace the Hub — they replace the source registered within it.
- Each source's lifecycle is independent. A Daily.co source can be added or removed without affecting the FHIR source.
- Credentials (OAuth tokens, API keys) are managed by `CredentialService`, which watches Firestore credential documents and feeds source behaviours. Server-side credential refresh is available via `POST /api/credentials/:credential_id`.

## Error Handling at the Boundary

The Hub does not know about orgs. It reports errors in terms of sources:

- No source registered for a resource type or URL → the caller maps this to `NoSelectedOrgError` or similar, based on application context.
- Source registered but resolver in error state (expired token, auth failure) → the Hub fails with `AuthError`. The caller can trigger reauth or show a login prompt.

This keeps the Hub domain-agnostic (it lives in `global/effectful-store`) while the frontend layer handles the mapping to user-facing errors.

## Subscribing to Hub State

The Hub's `SubscriptionRef` exposes a `changes` stream. Frontend consumers can subscribe to react when sources connect, disconnect, or recover from errors. Use cases:

- A connection status indicator showing which sources are active.
- A hook that re-triggers data fetching when a source transitions from error to healthy.
- Resource subscription: observing a resource URL and receiving updates when the underlying source's resolver changes (e.g., after reauth, the resource is re-fetched with fresh credentials).

## Migration Path

The migration from the former per-resource repository pattern to Hub is complete. All consumers now use Hub methods directly:

1. `hub.get(domainType, url)` — fetch a single resource
2. `hub.search(domainType, params?)` — search resources
3. `hub.create(domainType, resource, origin?)` — create a resource
4. `hub.createMany(domainType, resources, origin?)` — create multiple resources
5. `hub.update(domainType, resource)` — update a resource
6. `hub.delete(domainType, url)` — delete a resource
7. `hub.subscribe(domainType, url)` — subscribe to a single resource (returns `Stream<Either>`)
8. `hub.subscribeSearch(domainType, params?)` — subscribe to search results (returns `Stream<Either>`)

## See Also

- [Hub Design Explanation](../../../../global/effectful-store/docs/Hub%20Design%20Explanation.md) — Hub internals, routing, and source lifecycle
- [Platform Services Reference](./Platform%20Services%20Reference.md) — Current service catalog and wiring
- [Architecture Explanation](../../../../docs/Architecture/Explanation.md) — Layered architecture
