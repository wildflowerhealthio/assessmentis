# Hub Integration Explanation

This document explains how the effectful-store Hub replaces `ClinicalDataRepositoryService` in the frontend and how it fits into the platform service graph.

For background on the Hub's internal design, see [Hub Design Explanation](../../../../global/effectful-store/docs/Hub%20Design%20Explanation.md).

## What Changes

`ClinicalDataRepositoryService` currently provides per-resource-type Effect and Stream accessors, each wrapping an underlying `FhirR4Client`. The Hub replaces this with a single routing layer that consumers call directly.

Before:
```
FhirR4ClientService → ClinicalDataRepositoryService → per-resource repository Effects/Streams
```

After:
```
FhirR4ClientService → FhirR4SourceBehaviour → Hub (single instance, all resource types)
```

Consumers stop asking for a repository-per-type and instead call `hub.get()`, `hub.search()`, `hub.create()`, etc., passing the `domainType` as a parameter. The Hub routes internally.

## Wiring in PlatformContextProvider

The Hub is created once during platform initialization and added to `PlatformContext`. Source registration is driven by reactive streams (org changes, auth state), not static configuration.

Sketch of the wiring:

```typescript
const hub = yield* makeHub<ClinicalResources>()

// FHIR source lifecycle driven by org stream
yield* orgStream.pipe(
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
- `FhirR4ClientService` still exists and provides the `clientStream` that feeds `FhirR4SourceBehaviour`. The client service handles GAPI initialization and token syncing; the source behaviour translates that into resolvers.

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

The migration from `ClinicalDataRepositoryService` to Hub is mechanical:

1. Every call to `service.repositoryEffect(resourceType)` followed by `repo.get(id)` becomes `hub.get({ domainType, url })`.
2. Every call to `repo.getMany(params)` becomes `hub.search({ domainType, params })`.
3. Every call to `repo.create(resource)` becomes `hub.create({ domainType, resource, origin })`.
4. Every call to `repo.update(resource)` becomes `hub.update({ domainType, resource })`.
5. Every call to `repo.delete(id)` becomes `hub.delete({ domainType, url })`.

The `clinicalDataRepositoryLayers.bak` file and `ClinicalDataRepositoryService` can be removed once all consumers are migrated.

## See Also

- [Hub Design Explanation](../../../../global/effectful-store/docs/Hub%20Design%20Explanation.md) — Hub internals, routing, and source lifecycle
- [Platform Services Reference](./Platform%20Services%20Reference.md) — Current service catalog and wiring
- [Architecture Explanation](../../../../docs/Architecture/Explanation.md) — Layered architecture
