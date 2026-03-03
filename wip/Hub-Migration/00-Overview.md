# Hub Migration Plan — Overview

## Context

`ClinicalDataRepositoryService` wraps `FhirR4ClientService` to provide per-resource-type Effect and Stream accessors that resolve to `ClinicalDataRepository<T>`. The new `Hub` in `global/effectful-store` replaces this with a single resolver that routes requests to the appropriate origin. The Hub is already created in `PlatformContextProvider` (line 55) and passed to `startFhirR4ClientService`, but is not yet exposed to consumers.

**Goal:** Every frontend consumer switches from `clinicalDataRepositoryService.stream.X / repo.get()` to `Effect.request(req, hub.resolver)`. All reactive Stream patterns become one-shot Effects. The `ClinicalDataRepositoryService` and individual repository tags are removed from the frontend.

## Design Decisions

- **Hub API**: Consumers use `Effect.request(requestObj, hub.resolver)` directly — no convenience methods
- **Reactivity**: One-shot Effects only. Replace `StreamEither` / `useEitherStream` with `Effect.gen` / `useEffectTs`
- **Create origin**: `hub.getDefaultOrigin(domainType)` returns first ready origin for writes
- **createMany**: `Effect.forEach` over individual Create requests with `{ concurrency: 'unbounded' }`
- **Hub access**: `ClinicalHub` Effect.Tag wrapping `Hub<ResourceDataTypes>` — domain actions `yield* ClinicalHub`, route components provide via `Effect.provideService(ClinicalHub, hub)`
- **String IDs**: Construct ReadonlyUrl from `origin.appendToPathname('/ResourceType/id')` using `hub.getDefaultOrigin()`

## Key Utilities (reuse these)

| Utility | Location | Purpose |
|---------|----------|---------|
| `ReadonlyUrl.appendToPathname(path)` | `global/effectful-store/src/ReadonlyUrl.ts:149` | Construct resource URL from origin + path |
| `ReadonlyUrl.hasChild(other)` | `global/effectful-store/src/ReadonlyUrl.ts:134` | Check if URL is child of origin (prefix match) |
| `ReadonlyUrl.FromString` | `global/effectful-store/src/ReadonlyUrl.ts:77` | Parse string to ReadonlyUrl |
| `useEffectTs(effect)` | `global/react-util/src/hooks/effectHooks.ts:78` | Convert `Effect<A, E, Scope.Scope>` to `Promise<A>` |
| `Request.of<T>()(data)` | `effect` package | Construct Effect Request objects (see Hub.ts:293 for example) |
| `Hub.makeHub<R>()` | `global/effectful-store/src/Hub.ts:321` | Hub factory |

## Request Construction Pattern

```typescript
import { Request as EffectRequest, Effect } from 'effect'
import type { ResourceRequest } from '@assessmentis/effectful-store'

// Get (needs origin + full URL):
const origin = yield* hub.getDefaultOrigin('Patient')
const url = origin.appendToPathname('/Patient/' + patientId)
yield* Effect.request(
  EffectRequest.of<ResourceRequest.Get<Patient>>()({
    _tag: 'Get', domainType: 'Patient', url, origin,
  }),
  hub.resolver
)

// Search (fan-out, origin: null):
yield* Effect.request(
  EffectRequest.of<ResourceRequest.Search<Patient>>()({
    _tag: 'Search', domainType: 'Patient', params: filters ?? {}, origin: null,
  }),
  hub.resolver
)

// Create (needs explicit origin):
const origin = yield* hub.getDefaultOrigin('Location')
yield* Effect.request(
  EffectRequest.of<ResourceRequest.Create<Location>>()({
    _tag: 'Create', domainType: 'Location', resource: locationData, origin,
  }),
  hub.resolver
)

// Update (origin from existing resource URL):
const origin = yield* hub.getOriginUrlForResource(resource.url)
yield* Effect.request(
  EffectRequest.of<ResourceRequest.Update<Encounter>>()({
    _tag: 'Update', domainType: 'Encounter', resource, origin,
  }),
  hub.resolver
)

// Delete (origin from resource URL):
const url = Schema.decodeSync(ReadonlyUrl.FromString)(urlKey)
const origin = yield* hub.getOriginUrlForResource(url)
yield* Effect.request(
  EffectRequest.of<ResourceRequest.Delete<Media>>()({
    _tag: 'Delete', domainType: 'Media', resource: { url }, origin,
  }),
  hub.resolver
)
```

## Stage Dependency Graph

```text
Stage 0 (Foundation)
   |
   +---> Stage 1 (Detail pages)  \
   |                               +---> Stage 4 (Remaining routes) ---> Stage 5 (Cleanup)
   +---> Stage 2 (Shared infra) --+
   |                               |
   +---> Stage 3 (Domain actions) /
```

Stages 1, 2, 3 can proceed in parallel after Stage 0.
Stage 4 depends on all of 1, 2, 3.
Stage 5 depends on Stage 4.
