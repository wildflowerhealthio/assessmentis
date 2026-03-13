# Hosted Services Analysis

Research analysis of the "hosted services" pattern in `platform-domain` and how it maps to idiomatic Effect-TS patterns.

## Current Architecture

### What are "hosted services"?

The `hostedServices/` directory contains four modules that manage long-running, stateful, reactive services on the client side:

| Module                              | Manages                                                    | Lifecycle primitives used                                                               |
| ----------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `AuthDataCredentialRepository`      | Credentials derived from auth token stream                 | `SubscriptionRef`, `Stream.runForEach`, `Effect.forkScoped`                             |
| `DocumentStoreCredentialRepository` | Credentials stored in DocumentStore with proactive refresh | `SubscriptionRef`, `SynchronizedRef`, `Fiber`, `Stream.runForEach`, `Effect.forkScoped` |
| `OrgService`                        | Selected org slug + resolved Org document                  | `PubSub` (sliding, replay 1), `Effect.forkDaemon`, `Stream.runIntoPubSub`               |
| `UserService`                       | Authenticated user's profile document                      | `PubSub` (sliding, replay 1), `Effect.forkDaemon`, `Stream.runIntoPubSubScoped`         |

### How they're wired (PlatformContextProvider)

All four are started imperatively in `PlatformContextProvider.tsx`:

```typescript
platformEffect = Effect.gen(function* () {
  const authDataPubSub = yield* createAuthDataPubSub // PubSub factory
  const orgSlugPubsub = yield* createOrgSlugPubSub
  // ... more PubSub creation ...
  const authDataService = yield* startAuthDataService(authDataPubSub)
  const orgService = yield* startOrgService(orgSlugPubsub, orgPubSub)
  const userService = yield* startUserService(userPubSub).pipe(
    Effect.provideService(AuthDataService, authDataService)
  )
  // ...
})
```

A manually-created `Scope` is provided (`Scope.make()` + `Effect.provideService(Scope.Scope, scope)`), but it is never closed — these services are intended to live for the app's lifetime.

### Supporting patterns

- **Tag classes** (`tagClasses/`): `AuthDataService`, `DocumentStore`, `CurrentOrg`, `CurrentUserId` are standard Effect `Context.Tag` definitions. These are clean and idiomatic.
- **Services** (`services/`): `LoadedOrg`, `LoadedUser`, `OrgAdminService`, `OrgUserService` use `Layer.effect(Tag, ...)` which is the standard Effect pattern for request-scoped service construction. These are already idiomatic.
- **`effectful-store` Hub**: `makeHub` uses `SubscriptionRef` + `Effect.forkScoped` — the same reactive pattern as the credential repositories, but packaged more cleanly.

---

## Analysis

### 1. Does Effect have established patterns for "hosted services"?

Yes. Effect's `Layer` system is explicitly designed for long-running services with lifecycle management:

- **`Layer.scoped`** creates a layer whose acquisition runs in a `Scope`. When the scope closes, all `acquireRelease` resources are finalized. This is the canonical pattern for services that need startup/shutdown.
- **`Effect.acquireRelease`** pairs resource acquisition with a finalizer, guaranteed to run on scope closure. This replaces manual `shutdown` methods.
- **`Layer.launch`** runs a Layer as a long-lived service, managing its scope automatically.
- **`ManagedRuntime`** wraps a Layer into a runtime that can be used from non-Effect code (like React components). It handles scope lifecycle.

The current code does not use any of these. Instead, it manually:

1. Creates PubSubs
2. Passes them to `start*` functions
3. Forks daemon fibers
4. Returns objects with explicit `shutdown` methods

### 2. Could these services be restructured using Effect Layers?

Yes, significantly. Here is the mapping:

#### OrgService and UserService

Currently: factory functions (`startOrgService`, `startUserService`) that take PubSubs as arguments, fork daemon fibers, and return service objects with manual `shutdown` effects.

Idiomatic alternative: `Layer.scoped` + `Effect.acquireRelease`.

```typescript
// Sketch — OrgService as a Layer
export const OrgServiceLive: Layer.Layer<OrgService, never, DocumentStore> =
  Layer.scoped(
    OrgService,
    Effect.gen(function* () {
      const documentStore = yield* DocumentStore
      const orgSlugRef = yield* SubscriptionRef.make(...)

      // The stream-draining fiber is scoped — will be interrupted on Layer teardown
      yield* Stream.runForEach(watchStream, (v) => SubscriptionRef.set(orgSlugRef, v)).pipe(
        Effect.forkScoped
      )

      return { /* service methods reading from orgSlugRef */ }
    })
  )
```

Key benefits:

- **No PubSub plumbing exposed to callers.** The PubSub/SubscriptionRef is an internal implementation detail.
- **No manual `shutdown` method.** Scope finalization handles cleanup.
- **Composable via `Layer.provide`.** Instead of manually wiring in `PlatformContextProvider`, you declare dependency relationships and Effect resolves them.
- **The PlatformContextProvider shrinks** to roughly `Layer.mergeAll(OrgServiceLive, UserServiceLive, ...)`.

#### Credential Repositories

Currently: `makeDocumentStoreCredentialRepository` and `makeAuthDataCredentialRepository` are `Effect.gen` factories. They use `Effect.forkScoped` correctly but manage their own caches via mutable `Map`.

These are closer to idiomatic already, but could benefit from:

- Using `Effect.cachedWithTTL` or `Effect.cached` for the per-identity cache instead of a manual `Map`.
- Using `Effect.acquireRelease` for the refresh fiber lifecycle instead of `SynchronizedRef<Option<Fiber>>`.

### 3. Which Effect primitives would make these cleaner?

#### `Effect.acquireRelease` for fiber lifecycle

The `DocumentStoreCredentialRepository` manually tracks refresh fibers in a `SynchronizedRef<Option<Fiber>>`, interrupting old fibers and forking new ones. This is a resource lifecycle problem:

```typescript
// Current: manual fiber tracking
const nextRefreshFibre =
  yield * SynchronizedRef.make<Option<Fiber>>(Option.none())
// ... later, manually interrupt + fork

// Alternative: acquireRelease scopes the fiber automatically
// Each credential's refresh could be its own scoped resource
```

#### `SubscriptionRef` instead of `PubSub` for single-value reactive state

`OrgService` and `UserService` use `PubSub.sliding({ capacity: 1, replay: 1 })` which is effectively a single-value reactive cell. `SubscriptionRef` is the idiomatic Effect primitive for exactly this:

- `SubscriptionRef` is a `Ref` with a `.changes` stream — exactly what these services need.
- It eliminates `Take` wrapping/unwrapping, `pubsubAsPerpetualStream`, and `takeOneFromPubSubOrDie`.
- It supports `Readable`/`Subscribable` protocols natively.

The `effectful-store` Hub already uses `SubscriptionRef` this way, so the pattern exists in the codebase.

#### `Layer.scoped` for service lifecycle

Replaces the manual `start*` + `shutdown` pattern. The Layer's scope manages fiber interruption, PubSub shutdown, and any other cleanup.

#### `ManagedRuntime` for React integration

Instead of manually creating a `Scope` in `useMemo` (which is never closed), `ManagedRuntime` provides:

- Automatic scope management
- A `runPromise` method for use in React
- Proper cleanup via `dispose()`

### 4. What's missing for better ergonomics?

#### a. Declarative dependency graph

The current `PlatformContextProvider` imperatively sequences service startup and manually threads dependencies. With Layers:

```typescript
const PlatformLayer = Layer.mergeAll(
  OrgServiceLive,
  UserServiceLive,
  CredentialRepositoryLive
).pipe(Layer.provide(AuthDataServiceLive), Layer.provide(DocumentStoreLive))
```

Effect resolves the dependency graph, ensures correct ordering, and shares resources (memoization is built into Layer).

#### b. Error channel propagation

The hosted services currently swallow construction errors (the `start*` functions have `never` in their error channel in some cases, or errors are logged but not surfaced structurally). Layers propagate construction errors cleanly through `Layer.Layer<A, E, R>`.

#### c. Testability

`Layer.scoped` services are trivially testable: provide a test Layer for `DocumentStore` and the service constructs normally. The current pattern requires callers to create PubSubs, which is setup ceremony that tests shouldn't need.

#### d. SubscriptionRef over PubSub+Take for single-value state

The `pubsubAsPerpetualStream` + `takeOneFromPubSubOrDie` combo exists because PubSub was chosen for a single-value-with-updates use case. `SubscriptionRef` eliminates this indirection entirely.

### 5. Credential repository lifecycle: could Effect handle this better?

The `DocumentStoreCredentialRepository` is the most complex hosted service. It manages:

1. **Per-identity caching** (mutable `Map`)
2. **DocumentStore watch** (stream drained into SubscriptionRef via `forkScoped`)
3. **Proactive refresh scheduling** (fiber forked with delay, tracked in `SynchronizedRef<Option<Fiber>>`)

Each of these has a more idiomatic Effect counterpart:

| Current                                      | Idiomatic alternative                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Manual `Map` cache                           | `Effect.cached` or `Cache` (Effect's built-in TTL cache)                      |
| `SynchronizedRef<Option<Fiber>>` for refresh | `Effect.acquireRelease` scoping the refresh fiber, or `Schedule`-based retry  |
| Duration arithmetic for refresh timing       | `Schedule.duration` + `Schedule.delayed`                                      |
| Manual fiber interrupt + re-fork             | Scoped fibers that are naturally interrupted when the credential scope closes |

The refresh scheduling logic (lines 280-311 of `DocumentStoreCredentialRepository.ts`) manually computes delay durations and forks fibers. Effect's `Schedule` module handles this pattern declaratively:

```typescript
// Sketch: scheduled refresh
const refreshSchedule = Schedule.once.pipe(
  Schedule.delayed(() => timeUntilRefreshNeeded(token))
)
credential.refresh.pipe(Effect.schedule(refreshSchedule))
```

However, the current design re-schedules on every token update (cancelling the old timer), which is inherently stateful. The `SynchronizedRef<Option<Fiber>>` approach works but could be replaced by a `Scope`-per-credential where the refresh fiber lives inside the credential's scope and is naturally interrupted when a new token arrives and the old scope closes.

---

## Summary of Recommendations

| Area                     | Current                                          | Recommended                        | Impact                                                |
| ------------------------ | ------------------------------------------------ | ---------------------------------- | ----------------------------------------------------- |
| OrgService / UserService | `start*` + manual shutdown                       | `Layer.scoped`                     | Eliminates boilerplate, enables composition           |
| Reactive state primitive | `PubSub.sliding` + `Take` + utility wrappers     | `SubscriptionRef`                  | Removes `Take` ceremony, utilities become unnecessary |
| Service wiring           | Imperative sequencing in PlatformContextProvider | `Layer.mergeAll` + `Layer.provide` | Declarative dependency graph, auto-memoization        |
| React integration        | Manual `Scope.make()` never closed               | `ManagedRuntime`                   | Proper cleanup, standard API                          |
| Credential cache         | Manual `Map`                                     | `Cache` or `Effect.cached`         | Built-in TTL, automatic eviction                      |
| Refresh fiber lifecycle  | `SynchronizedRef<Option<Fiber>>`                 | Scoped fibers or `Schedule`        | Automatic cleanup, less manual state                  |
| Error propagation        | `shutdown` methods, swallowed errors             | Layer error channel                | Structural error surfacing                            |

### Migration path

A reasonable order of changes:

1. **Replace PubSub with SubscriptionRef** in OrgService and UserService. This is the smallest change with the most immediate ergonomic benefit, and has precedent in the codebase (`effectful-store` Hub already does this).
2. **Convert `start*` functions to `Layer.scoped`**. This removes manual shutdown methods and PubSub-creation ceremony.
3. **Refactor PlatformContextProvider** to use `Layer.mergeAll` + `ManagedRuntime`. This is the biggest change but follows naturally from (2).
4. **Improve credential repository internals** (cache, refresh scheduling). This is lower priority since the current implementation works, but would benefit from `Cache` and scoped fibers.

### Risks and caveats

- **PubSub vs SubscriptionRef semantics differ slightly.** PubSub supports multiple independent subscribers with replay; SubscriptionRef's `.changes` is also multi-subscriber but the replay semantics work differently (via `Ref.get`). For the single-value-with-latest use case here, SubscriptionRef is a better fit, but verify that all consumers only need the latest value.
- **Layer memoization.** Effect Layers are memoized by default when composed. This is usually desirable but means two uses of the same Layer share state. For these singleton services that is correct behavior, but it's worth being explicit about.
- **ManagedRuntime cleanup.** The current code intentionally never closes the scope (app-lifetime services). `ManagedRuntime.dispose()` would need to be called on app unmount or not at all, matching current behavior.
- **The `effectful-store` Hub pattern is the closest existing model** in the codebase. `makeHub` uses `SubscriptionRef` + `Effect.forkScoped` and returns a composed service object. The hosted services should converge toward this pattern.
