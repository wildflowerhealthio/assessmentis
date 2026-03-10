# Hub Design Explanation

The Hub is the central routing layer in effectful-store. It connects consumers to data sources, routes operations to the right source, and reacts to configuration changes over time.

## Core Concepts

### Origin vs URL

Two distinct URL concepts appear throughout the system:

- **Origin** (`ReadonlyUrl`) — the base URL identifying a data source. Example: `fhir-r4+https://healthcare.googleapis.com/.../fhir`. A source's origin anchors its URL space.
- **URL** (`ReadonlyUrl`) — the full URL identifying a specific resource. Example: `fhir-r4+https://healthcare.googleapis.com/.../fhir/Patient/abc123`. A resource's URL always falls within exactly one origin's URL space.

`ReadonlyUrl.contains()` determines ownership: an origin contains a resource URL when protocol + host match and the origin's pathname is a prefix of the resource's pathname.

### SourceBehaviour

A `SourceBehaviour` is a live source definition. It tells the Hub:

- **What it is** — its `origin`
- **What resource types it handles** — via `activeResources` (a map of resource type to boolean)
- **How to resolve requests against it** — via `resolverStream`, a `StreamEither` that emits `MultiResolver` instances (Right) or errors like `AuthError` (Left)
- **How to trigger re-authentication** — via `provokeReauth`

A source can be registered with the Hub even when its resolver is in an error state. The `resolverStream` being a `StreamEither` means Left emissions (auth failures, expired tokens) are a normal part of the source lifecycle, not a termination event.

### Hub

The Hub is a plain class instance backed by a `SubscriptionRef`. Its internal state is a map of origin string to the current state of each registered source:

```typescript
SubscriptionRef<ReadonlyMap<string, SourceEntry>>
```

Each `SourceEntry` captures:

- The source's `origin`
- Which resource types it supports (`activeResources`)
- Its current `status`: either a working `MultiResolver` (Right) or an error (Left)
- Its `provokeReauth` callback

The SubscriptionRef serves two purposes:

1. **Operations** (`get`, `search`, etc.) read the current state to find the right source and resolver.
2. **Subscribers** can observe `hub.changes` to react when sources connect, disconnect, or change state (e.g., a UI showing connection status, or a hook that re-fetches when the underlying source recovers from an auth error).

## Operation Routing

Different operations use different routing strategies:

| Operation | Routing strategy            | Rationale                                                  |
| --------- | --------------------------- | ---------------------------------------------------------- |
| `get`     | URL prefix match            | The resource URL tells you which source owns it            |
| `update`  | URL prefix match            | The resource already has a source-scoped URL               |
| `delete`  | URL prefix match            | Same                                                       |
| `search`  | Fan-out by resource type    | No URL to route by; merge results from all capable sources |
| `create`  | Explicit `origin` parameter | Caller must decide where to write                          |

For `search`, the Hub finds all registered sources where `activeResources[domainType]` is true and fans out the request, merging results. An optional `origin` parameter scopes the search to a single source.

For `create`, the caller provides the target `origin` explicitly. This is essential for multi-source workflows like reading from one source and writing to another.

When an operation routes to a source whose status is Left (e.g., `AuthError`), the operation fails with that error rather than "no source found." The caller gets a meaningful, actionable error.

## Source Lifecycle

Sources register and unregister individually via `hub.addSource()` and `hub.removeSource()`.

When `addSource` is called:

1. The source is added to the SubscriptionRef state (initially with Left status until the first resolver arrives).
2. A fiber is forked that subscribes to the source's `resolverStream`.
3. Each emission (Right or Left) updates that source's entry in the SubscriptionRef.
4. The fiber is tied to a `Scope` and cancels automatically when the scope closes.

When `removeSource` is called:

1. The source's subscription fiber is cancelled.
2. The source is removed from the SubscriptionRef state.

This design means source lifecycles are independent. Adding a new source doesn't affect existing ones. An org switch might replace the FHIR source while a Daily.co source stays connected.

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
