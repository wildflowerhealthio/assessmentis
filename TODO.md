# TODO: Hub redesign — replace ClinicalDataRepositoryService

## Design docs

Read these first:

- [Hub Design Explanation](global/effectful-store/docs/Hub%20Design%20Explanation.md) — Hub internals, routing, source lifecycle, multi-source support
- [Hub Integration Explanation](apps/frontend/app/layers/Hub%20Integration%20Explanation.md) — How the Hub replaces ClinicalDataRepositoryService in the frontend

## Summary of the design

The Hub is a class instance backed by a `SubscriptionRef<ReadonlyMap<string, OriginEntry>>`. Each entry tracks an `originUrl` (base URL), which resource types it handles, and its current `status` (either a working `MultiResolver` or an error like `AuthError`).

Origins are managed via `setSource`/`setSourceError`/`removeSource`. The caller is responsible for source lifecycle — the Hub does not subscribe to streams or manage fibers internally.

The Hub exposes a `RequestResolver` as its primary interface. Consumers use `Effect.request(req, hub.resolver)` rather than typed convenience methods. Routing is determined by the request:

- **get/update/delete** — route by URL prefix match (`ReadonlyUrl.hasChild()`) to find the owning origin
- **search** — fan out to all origins that support the given `domainType`, merge results. Optional `origin` field on the request to scope to one origin.
- **create** — if `resource.url` is set, route by URL prefix. Otherwise, use the request's `origin` field. Fail if neither.

The SubscriptionRef's `changes` stream enables subscribers to react when origins connect, disconnect, or change state.

## What has been done (Phase 1 — first pass)

The following changes are already on the branch `ruthmarks/refactor/seperate-fhir-from-data-types`:

### Completed

1. **`ReadonlyUrl.hasChild()`** — The old `contains()` method was renamed to `hasChild()` and its semantics were fixed so that `origin.hasChild(resourceUrl)` returns true when the origin's pathname is a prefix of the resource URL's pathname (protocol and host must also match). Tests added.

2. **`SourceBehaviour.ts`** — Field renamed from `url: string` to `origin: ReadonlyUrl`.

3. **`FhirR4ResourceBehaviour.ts`** — Updated to set `origin: url` instead of `url: url.toString()`.

4. **`Hub.ts`** — First-pass rewrite as an ES class with `SubscriptionRef`-backed state, fiber pool for resolverStream subscriptions, and typed CRUD methods. This implementation works but needs to be simplified per feedback below.

5. **`Hub.test.ts`** — Tests written using `@effect/vitest` with `it.effect` and `it.effect.prop`. All 17 tests pass. Uses Queue-based streams for reliable concurrency and a `squashFailure` helper for error assertions. Uses `_tag` for error discrimination (not `instanceof`).

6. **`ReadonlyUrl.test.ts`** — 6 new `hasChild` tests added (including a property test). All 21 tests pass.

### Current state

- `effectful-store` typechecks clean and all 38 tests pass
- `fhir-r4` typechecks clean
- `functions` package fails typecheck because `hub.create()` now requires `origin` — this is expected and will be fixed when consumers are migrated (Phase 2)

## Phase 1 continued: Simplify the Hub (NEXT TASK)

The first-pass Hub works but has design issues that should be addressed **before** moving to Phase 2. All changes in this section are scoped to `global/effectful-store/` only.

### Design decisions (confirmed with user)

1. **Remove `resolverStream` from OriginBehaviour** — The Hub should not maintain a fiber pool. Instead, the caller manages source lifecycle externally and calls `setSource`/`setSourceError`/`removeSource` to update the Hub. This eliminates `Scope` from the Hub's API.

2. **Hub as `RequestResolver`** — The Hub should expose a `resolver` property instead of typed CRUD methods (`get`, `search`, `create`, `update`, `delete`). Consumers use `Effect.request(req, hub.resolver)` directly. No typed convenience methods.

3. **Separate `setSourceError` method** — `setSource` always takes a working `OriginBehaviour` (with a resolver). A separate `setSourceError(originUrl, error)` marks an existing origin as errored while preserving its metadata (`activeResources`, `provokeReauth`). If the origin doesn't exist, it fails.

4. **Create routing infers from URL** — If `resource.url` is set on a Create request, the Hub infers the origin via URL prefix match (like get/update/delete). If `resource.url` is undefined, the explicit `origin` field on the request is required. If neither, fail with `UnhandledError`.

5. **Rename to "origin" terminology** — `SourceBehaviour` → `OriginBehaviour`, field `origin` → `originUrl`.

### Step 1: Rename SourceBehaviour → OriginBehaviour

File: `global/effectful-store/src/SourceBehaviour.ts` → rename to `OriginBehaviour.ts`

```typescript
// New interface — note: no Deps type param, no resolverStream
export interface OriginBehaviour<
  in out Resources extends { readonly [k: PropertyKey]: Resource.Resource<typeof k> },
  in ActiveResourceTypes extends keyof Resources,
> {
  readonly originUrl: ReadonlyUrl
  readonly activeResources: {
    readonly [K in keyof Resources]: boolean
  } & {
    readonly [K in ActiveResourceTypes]: true
  }
  readonly resolver: MultiResolver<Resources, ActiveResourceTypes, never>
  readonly provokeReauth: () => Effect.Effect<void, AuthError, never>
}

// Update InferActiveResourceTypes to use OriginBehaviour
```

Key changes from current `SourceBehaviour`:
- `origin: ReadonlyUrl` → `originUrl: ReadonlyUrl`
- `Deps` type param removed (always `never` — sources provide their own deps before the resolver enters the Hub)
- `resolverStream: StreamEither<MultiResolver, ...>` → `resolver: MultiResolver<..., never>` (a single resolver, not a stream)
- No more `@assessmentis/util` import for `StreamEither`

### Step 2: Make ResourceRequest origin-aware

File: `global/effectful-store/src/ResourceRequest.ts`

Add `origin?: ReadonlyUrl` to `Search` and `Create`:

```typescript
// Search — add optional origin
export interface Search<TResource extends Resource.AnyResource>
  extends Request.Request<ReadonlyArray<Resource.WithResourceUrl<TResource>>, CommonErrors> {
  readonly _tag: 'Search'
  readonly domainType: TResource['domainType']
  readonly params: SearchParam<TResource>
  readonly origin?: ReadonlyUrl  // optional: scopes search to one origin
}

// Create — add optional origin
export interface Create<TResource extends Resource.AnyResource>
  extends Request.Request<Resource.WithResourceUrl<TResource>, CommonErrors> {
  readonly _tag: 'Create'
  readonly domainType: TResource['domainType']
  readonly resource: TResource
  readonly origin?: ReadonlyUrl  // required if resource.url is undefined
}
```

Import `ReadonlyUrl` from `./ReadonlyUrl`.

### Step 3: Rewrite Hub.ts

**Internal state** — same `OriginEntry` / `HubState` types as current, but rename `origin` → `originUrl`:

```typescript
type OriginEntry<Resources> = {
  readonly originUrl: ReadonlyUrl
  readonly activeResources: { readonly [K in keyof Resources]: boolean }
  readonly status: Either.Either<
    MultiResolver<Resources, keyof Resources, never>,
    AuthError | AuthzError | UnhandledError
  >
  readonly provokeReauth: () => Effect.Effect<void, AuthError, never>
}
```

**Hub class** — no fiber pool, no `Scope` requirement:

```typescript
class Hub<Resources> {
  // State management
  setSource(behaviour: OriginBehaviour<Resources, keyof Resources>): Effect.Effect<void>
  setSourceError(originUrl: ReadonlyUrl, error: AuthError | AuthzError | UnhandledError): Effect.Effect<void>
  removeSource(originUrl: ReadonlyUrl): Effect.Effect<void>

  // The Hub IS a resolver
  readonly resolver: RequestResolver.RequestResolver<HubRequest<Resources>, never>

  // Reactive state
  readonly changes: Stream.Stream<HubState<Resources>>
}
```

**Private helpers** to reduce verbosity:
```typescript
private updateEntry(key: string, entry: OriginEntry<Resources>): Effect.Effect<void>
  // → SubscriptionRef.update(this.stateRef, state => { const next = new Map(state); next.set(key, entry); return next })
private removeEntry(key: string): Effect.Effect<void>
  // → SubscriptionRef.update(this.stateRef, state => { const next = new Map(state); next.delete(key); return next })
```

**Resolver routing**:
- `Get` / `Update` / `Delete` → `originByUrl(request.url)` → delegate to origin's resolver
- `Search` → if `request.origin` set, lookup that origin; else fan-out to all origins with `activeResources[domainType] === true`, merge results
- `Create` → if `request.resource.url` is set, `originByUrl(resource.url)`; else if `request.origin` set, lookup that origin; else fail with `UnhandledError`

**Constructor**: `makeHub<Resources>(): Effect.Effect<Hub<Resources>>` — no `Scope` needed.

### Step 4: Update index.ts

```typescript
export * as OriginBehaviour from './OriginBehaviour'
// Remove: export * as SourceBehaviour from './SourceBehaviour'
```

Delete `SourceBehaviour.ts`.

### Step 5: Rewrite tests

Tests become simpler — no Queue-based streams, no waiting for stream processing. Tests directly call `hub.setSource(behaviour)` and then use `Effect.request(req, hub.resolver)`.

Cover the same scenarios as current tests:
- No origins → requests fail with `UnhandledError`
- One origin → CRUD routes correctly
- Origin in error state (`setSourceError`) → operations fail with the specific error (e.g., `AuthError`), not "no source found"
- `setSource` replaces existing origin (recovery from error)
- `removeSource` removes origin
- URL-based routing with multiple origins
- Search fan-out and `origin` scoping
- Create routing: infer from `resource.url` vs explicit `origin`
- `changes` stream reflects state transitions

### Step 6: Verify

```bash
cd global/effectful-store
npx tsc --noEmit          # Typecheck effectful-store
npx vitest run            # Run Hub + ReadonlyUrl tests
```

`domain/fhir-r4` will fail typecheck because `FhirR4SourceBehaviour` still references the old interface — that's expected and will be updated in Phase 2.

## Phase 2: Wire Hub into the frontend

(Unchanged from original TODO — included for reference)

### 2.1 Add Hub to PlatformContext

File: `apps/frontend/app/layers/PlatformContext.tsx`

- Add `hub: Hub<ClinicalResources>` to the `PlatformContext` interface (where `ClinicalResources` is the resource type map from clinical-domain — this is the `Resources` type in `FhirR4ResourceBehaviour.ts`)
- Keep `clinicalDataRepositoryService` temporarily for incremental migration

### 2.2 Create and wire Hub in PlatformContextProvider

File: `apps/frontend/app/layers/PlatformContextProvider.tsx`

- Create Hub via `makeHub()`
- Wire the org stream to drive FHIR origin registration:
  - On each new org emission: `removeSource` the previous FHIR origin, `setSource` a new `OriginBehaviour` built from the FHIR client
  - Use the existing `fhirR4ClientService.clientStream` — subscribe to it externally and call `hub.setSource`/`hub.setSourceError` as the stream emits Right/Left values
  - Fork this as a scoped daemon
- Add `hub` to the platform context value

### 2.3 Migrate consumers (incremental)

Each consumer currently uses one of these patterns:

**Pattern A: `createResourceCollectionHook` / `createResourceCollectionHook.ts`**
- Replace with: `Effect.request(searchReq, hub.resolver)` for the effect path, subscribe to `hub.changes` for reactivity

**Pattern B: `createResourceActions.ts` (create/update actions)**
- Replace with: `Effect.request(createReq/updateReq, hub.resolver)`
- For create actions, the `origin` comes from the platform context or org config

**Pattern C: Direct repository usage in Encounter actions**
- Files: `createEncounter.ts`, `updateEncounter.ts`, `getEncounterRecordings.ts`, `updateEncounterRecordingsAndTranscripts.ts`, `getFullEncounter.ts`
- Replace with: Hub as the single dependency via `Effect.request`

**Pattern D: `EditResourcePage.tsx`**
- Replace with: `Effect.request(getReq, hub.resolver)`. Subscribe to `hub.changes` for re-fetch on recovery.

**Pattern E: `usePickerData.ts`**
- Replace with: `Effect.request(searchReq, hub.resolver)`

Consumer files to migrate (complete list):
- `apps/frontend/app/modules/common/utils/createResourceCollectionHook.ts`
- `apps/frontend/app/modules/common/actions/createResourceActions.ts`
- `apps/frontend/app/modules/common/hooks/useClinicalDataCollection.tsx`
- `apps/frontend/app/modules/resources/ResourcePages/EditResourcePage.tsx`
- `apps/frontend/app/modules/resources/ResourcePages/EditResourcePage.test.tsx`
- `apps/frontend/app/modules/resources/Encounter/actions/createEncounter.ts`
- `apps/frontend/app/modules/resources/Encounter/actions/updateEncounter.ts`
- `apps/frontend/app/modules/resources/Encounter/actions/getEncounterRecordings.ts`
- `apps/frontend/app/modules/resources/Encounter/actions/updateEncounterRecordingsAndTranscripts.ts`
- `apps/frontend/app/modules/interview-call/actions/getFullEncounter.ts`
- `apps/frontend/app/modules/common/components/BasePicker/hooks/usePickerData.ts`
- `apps/frontend/app/modules/resources/Questionnaire/features/QuestionnaireForm/QuestionnaireForm.tsx`
- `apps/frontend/app/test-utils.ts`

### 2.4 Remove ClinicalDataRepositoryService

Once all consumers are migrated:
- Delete `apps/frontend/app/layers/ClinicalDataRepositoriesService.ts`
- Delete `apps/frontend/app/layers/ClinicalDataRepositoriesService.test.ts`
- Delete `apps/frontend/app/layers/clinicalDataRepositoryLayers.bak`
- Remove from `PlatformContext.tsx` and `PlatformContextProvider.tsx`
- Update [Platform Services Reference.md](apps/frontend/app/layers/Platform%20Services%20Reference.md) — replace ClinicalDataRepositoryService entry with Hub

## Phase 3: Future work (not blocking)

- **Daily.co source** — implement an `OriginBehaviour` for Daily.co that handles Media/Location resources. Register it in PlatformContextProvider when the org has Daily.co configured.
- **Cross-source workflows** — e.g., read recordings from Daily.co, write Media resources to FHIR. Compose using Hub primitives: `Effect.request(searchReq, hub.resolver)` with Daily.co origin → `Effect.request(createReq, hub.resolver)` with FHIR origin.
- **Resource subscription** — allow subscribing to a specific resource URL and receiving updates when the underlying data or source state changes. The `changes` stream on the SubscriptionRef is the foundation for this.

## Key files for reference

| File                                                          | Role                                             |
| ------------------------------------------------------------- | ------------------------------------------------ |
| `global/effectful-store/src/Hub.ts`                           | Hub implementation (simplify)                    |
| `global/effectful-store/src/Hub.test.ts`                      | Hub tests (rewrite)                              |
| `global/effectful-store/src/SourceBehaviour.ts`               | Rename → `OriginBehaviour.ts`, redesign          |
| `global/effectful-store/src/Resource.ts`                      | Resource type definitions (unchanged)            |
| `global/effectful-store/src/ResourceRequest.ts`               | Request types — add origin fields                |
| `global/effectful-store/src/ReadonlyUrl.ts`                   | URL type with `hasChild()` for routing           |
| `global/effectful-store/src/index.ts`                         | Update exports                                   |
| `domain/fhir-r4/src/FhirR4ResourceBehaviour.ts`              | FHIR origin behaviour (Phase 2)                  |
| `apps/frontend/app/layers/ClinicalDataRepositoriesService.ts` | Service being replaced (Phase 2)                 |
| `apps/frontend/app/layers/FhirR4ClientService.tsx`            | Client service (stays, feeds origin behaviour)   |
| `apps/frontend/app/layers/PlatformContextProvider.tsx`        | Wiring point for Hub (Phase 2)                   |
| `apps/frontend/app/layers/PlatformContext.tsx`                | Context interface (Phase 2)                      |

## Testing patterns used in this codebase

- `@effect/vitest` with `it.effect` for Effect-based tests and `it.effect.prop` for property tests
- `Effect.exit` + `Exit.isFailure` + `Cause.squash` for error assertions; check `._tag` not `instanceof`
- `Effect.scoped` wrapper for tests that need `Scope`
- Tests in `global/effectful-store/` run via `cd global/effectful-store && npx vitest run`
- ReadonlyUrl has `Arbitrary.make(ReadonlyUrl)` for property testing
