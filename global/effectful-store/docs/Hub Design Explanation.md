# Hub Design Explanation

The Hub is the central routing layer in effectful-store. It connects consumers to data sources, routes operations to the right source, and reacts to configuration changes over time.

## Core Concepts

### Origin vs URL

Two distinct URL concepts appear throughout the system:

- **Origin** (`ReadonlyUrl`) — the base URL identifying a data source. Example: `fhir-r4+https://healthcare.googleapis.com/.../fhir`. A source's origin anchors its URL space.
- **URL** (`ReadonlyUrl`) — the full URL identifying a specific resource. Example: `fhir-r4+https://healthcare.googleapis.com/.../fhir/Patient/abc123`. A resource's URL always falls within exactly one origin's URL space.

`ReadonlyUrl.hasChild()` determines ownership: an origin has a child resource URL when protocol + host match and the origin's pathname is a prefix of the resource's pathname.

### Origin State (`Origin.AnyState`)

An `Origin.AnyState` is a discriminated union (`Origin.Ready | Origin.Loading | Origin.Errored`) representing the current state of a registered data source. All three variants share an internal `Base` interface that captures:

- **`originUrl`** (`ReadonlyUrl`) — the base URL identifying the source
- **`supportedResources`** — a map of resource type to boolean indicating which types this source handles
- **`provokeReauthenticate`** / **`provokeReauthorize`** — callbacks to trigger re-authentication or re-authorization

The three variants are discriminated structurally (no `_tag` field):

- **`Origin.Ready`** — `resolver` is a `RequestResolver` that can handle Get, Search, Create, Update, and Delete requests for the source's supported resource types. `errorStatus` is `undefined`.
- **`Origin.Loading`** — Both `resolver` and `errorStatus` are `undefined`. The origin has registered but hasn't connected yet.
- **`Origin.Errored`** — `resolver` is `undefined`, `errorStatus` is one of `AuthError`, `AuthzError`, or `UnhandledError`. The origin is in a permanent error state.

A source can be registered with the Hub even when it is not ready. Error states (auth failures, expired tokens) are a normal part of the source lifecycle, not a termination event.

#### Predicates and matching

The `Origin` module exports type-narrowing predicates (`Origin.isReady`, `Origin.isLoading`, `Origin.isErrored`, `Origin.isNotLoading`) and a 3-way `Origin.match` function that exhaustively handles all variants:

```typescript
Origin.match(origin, {
  onReady: (o) => /* Origin.Ready */,
  onLoading: (o) => /* Origin.Loading */,
  onErrored: (o) => /* Origin.Errored */,
})
```

`Origin.supports` narrows a `Origin.Ready` to prove it supports a specific resource type.

### Hub

The Hub is a plain object (not a class) backed by a `SubscriptionRef`. Its internal state wraps the origin map in an `Either` so the Hub itself can be in a loading or error state:

```typescript
SubscriptionRef<Either<HubState, HubError>>
```

where `HubState = HashMap<string, Origin.AnyState<never>>`.

The `Either` wrapper means the Hub distinguishes between "no origins registered yet" (Right with empty map) and "Hub is still initializing" (Left with `Loading`). Operations use `awaitReady` to wait for the Hub to leave the Loading state before routing.

The Hub exposes:

- **`changes`** — a `Stream` of Hub state, so subscribers can react when origins connect, disconnect, or change state (e.g., a UI showing connection status, or a hook that re-fetches when a source recovers from an auth error).
- **`resolver`** — a `RequestResolver` that routes any resource request through the resolver pipeline.
- **CRUD + subscription methods** (`get`, `search`, `create`, `createMany`, `update`, `delete`, `subscribe`, `subscribeSearch`) — each takes a `domainType` string as the first argument, routing to the appropriate origin(s).

## Operation Routing

Different operations use different routing strategies:

| Operation | Routing strategy         | Rationale                                                  |
| --------- | ------------------------ | ---------------------------------------------------------- |
| `get`     | URL prefix match         | The resource URL tells you which source owns it            |
| `update`  | URL prefix match         | The resource already has a source-scoped URL               |
| `delete`  | URL prefix match         | Same                                                       |
| `search`  | Fan-out by resource type | No URL to route by; merge results from all capable sources |
| `create`  | Infer or explicit origin | Caller may specify; if omitted, inferred when unambiguous  |

For `search`, the Hub finds all registered sources where `supportedResources[domainType]` is true and fans out the request, merging results. An optional `origin` parameter scopes the search to a single source.

For `create`, the caller may provide the target `origin` explicitly. If omitted, `resolveOriginForCreate` infers the single matching origin for the resource type and fails with `UnhandledError` when zero or multiple origins match. Explicit origin is essential for multi-source workflows like reading from one source and writing to another.

For `get`, `update`, and `delete`, `resolveOriginFromUrl` scans registered origins for one whose `originUrl.hasChild(url)` is true. It fails with `NotFoundError` when no origin matches and `UnhandledError` when multiple origins match (ambiguous ownership).

When an operation routes to a source whose `errorStatus` is a permanent error (e.g., `AuthError`, `AuthzError`), the operation fails with that error rather than "no source found." The caller gets a meaningful, actionable error. When a source is `Loading`, the operation waits for the source to become ready or settle to a permanent error, up to a 15-second timeout.

### Loading Awareness

Loading is treated as a transient state. Rather than failing immediately, operations encountering a Loading origin defer execution by watching the Hub's `changes` stream via `awaitOriginReady`. This utility:

1. Watches for the specific origin to leave the Loading state
2. Resolves with the `Origin.Ready` when available, allowing the operation to proceed
3. Fails with the origin's permanent error if it settles to one
4. Times out with `UnhandledError` after `LOADING_TIMEOUT` (15 seconds)

This behavior applies both in the resolver pipeline (`filterReadyOrigins`) and in fan-out search (`fanOutSearch`). The pattern is designed as a reusable primitive so any pipeline stage can defer work for Loading origins.

### Resolver Pipeline

The Hub's resolver processes batched request entries through a pure pipeline that separates routing decisions from effectful dispatch. Each step uses `SideEffect` — a lightweight container pairing a value with deferred `Effect<void>` actions — so that routing remains synchronous while accumulating side effects for later execution.

The pipeline stages are:

1. **`fanOutSearches`** — Separates global searches (`origin: null`) from origin-bound requests. Global searches are resolved via `fanOutSearch`, which clones the search to every origin supporting the resource type, waits for any Loading origins, runs them concurrently, and merges results. Fan-out search fails eagerly on permanent errors (all-or-nothing consistency). All other requests pass through.
2. **`groupByOrigin`** — Groups remaining requests by their `origin` field, looking up the corresponding `Origin.AnyState` in the hub state map. Requests targeting an unregistered origin fail with `UnhandledError`.
3. **`filterReadyOrigins`** — Separates groups by origin readiness. Ready groups pass through. Loading origins produce deferred actions that watch the changes stream and dispatch when ready (via `awaitOriginReady` + `dispatchGroupToResolver`). Permanent errors fail immediately.
4. **`dispatchToResolvers`** — For each ready group, delegates to `dispatchGroupToResolver`, which validates that the origin supports each request's `domainType` (via `Origin.supports`), then dispatches valid entries to the origin's resolver.

After the pipeline, all accumulated actions — including deferred Loading-await actions — are executed concurrently.

## Subscriptions

The Hub provides reactive subscriptions that re-emit when relevant origins change:

- **`subscribe(domainType, url)`** — emits `Either<Resource, Error>` whenever the origin owning `url` changes (connects, disconnects, or is replaced).
- **`subscribeSearch(domainType, params?)`** — emits `Either<Resource[], Error>` whenever any origin supporting `domainType` changes.

Both use `whenOriginChanges`, which filters the Hub's `changes` stream to only emit when the set of relevant origins differs (by reference equality on `Origin.AnyState` objects). Loading and error Hub states are silently skipped — subscriptions wait for a usable state.

## State Management

The Hub does not manage origin lifecycles directly — it has no `addSource` or `removeSource` methods. Instead, state is managed externally by whoever controls the `SubscriptionRef`:

- **`makeHubFromRef`** — builds a Hub from a pre-existing `SubscriptionRef`. The caller is responsible for updating the ref (adding, removing, or replacing origins). This is useful for testing and for contexts where origin management is handled by a separate layer.
- **`makeHub`** — builds a Hub driven by a `Stream` of state. It forks a scoped fiber that consumes the stream and updates an internal `SubscriptionRef`. The stream's lifecycle is tied to the enclosing `Scope`.

This separation means the Hub is purely a routing and resolution layer. Origin lifecycle management (connecting to servers, handling auth flows, retrying) lives in the platform layer that produces the state stream.

## Multi-Source Support

The Hub supports multiple sources with overlapping resource type coverage. This enables workflows like:

- **Read from Daily.co, write to FHIR** — search Media from a Daily.co source, then create into a FHIR source with an explicit origin.
- **Federated search** — search Patient across multiple FHIR stores, merge results.
- **Source-specific reads** — get a resource by URL; the URL itself routes to the right source.

The Hub does not impose directionality. The caller composes read-from-A, write-to-B flows using the Hub's primitives.

## See Also

- [Architecture Explanation](../../../docs/Architecture/Explanation.md) — Layered architecture and platform services
- [Effect Patterns Reference](../../../docs/Effect/Patterns%20Reference.md) — Effect-TS conventions
- [FHIR Modeling Reference](../../../domain/clinical-domain/docs/FHIR%20Modeling%20Reference.md) — FHIR R4 data modeling
