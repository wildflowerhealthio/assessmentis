# Moving HubStateUpdater to effectful-store — Analysis

## What HubStateUpdater does

`hubStateStream` (the sole export of `HubStateUpdater.ts`) transforms a stream of org+userOrg snapshots into a `Stream<Either<Hub.HubState, Error>>`. It:

1. Accepts an array of `OriginType` descriptors (tag + factory function) and an incoming `orgStream`.
2. For each org snapshot, iterates over `org.origins` (a `Record<UriEncodedOriginUrl, BaseOriginDefinition>`).
3. Wraps each definition + per-user originConfig into a `Data.struct` for structural equality comparison.
4. Uses a `Map`-based cache keyed by origin URL string. If the wrapped definition is `Equal.equals` to the cached one, the previous `Origin.AnyState` is reused; otherwise the matching `OriginType.make` factory is called to construct a new one.
5. For unknown origin tags, an `Errored` origin state is created inline.
6. Returns the resulting `HashMap<string, Origin.AnyState>` (which is `Hub.HubState`).

In short: it is the **bridge between the platform-domain concept of "an org has origins defined in Firestore" and the effectful-store concept of "a Hub has a HubState map of origin states"**.

## Current dependency graph

```
HubStateUpdater.ts
  depends on effectful-store:  Hub, Origin, Resource, ReadonlyUrl
  depends on ontology:         UnhandledError, AuthError, AuthzError, Loading
  depends on util:             deepDataStruct
  depends on platform-domain:  BaseOriginDefinition, OrgSlug, Org, OriginType, UserOrg
```

Platform-domain types used and their nature:

| Type | What it is | Domain-specific? |
|------|-----------|-----------------|
| `BaseOriginDefinition` | Schema.Struct with `_tag: string` and `activeResources: Record<string, true>`. Uses `onExcessProperty: 'preserve'`. | Mildly — it is a Schema-decoded config blob. The shape is generic. |
| `Org` | Schema with `slug`, `emoji`, `origins` (record of definitions), `originConfigs`, sync timestamps. | Yes — contains org-specific fields like `emoji`, sync timestamps. |
| `UserOrg` | Schema with `originConfig` (record of per-user origin configs). | Mildly — just a container for per-user config keyed by origin URL. |
| `OrgSlug` | Branded string. | Yes — platform-domain identity type. |
| `OriginType<Resources, R>` | Interface with `tag: string` and `make` factory. | Uses `BaseOriginDefinition` but the interface itself is fairly generic. |

## Consumers

`hubStateStream` is currently only consumed within `platform-domain` itself (exported via `services/index.ts`). No app-level code imports it yet. This means a move would have **zero downstream migration cost** today.

## Pros of moving to effectful-store

1. **Conceptual cohesion.** `hubStateStream` produces `Hub.HubState`, and `makeHub` consumes it. They are two halves of the same lifecycle. Having the producer live in effectful-store next to the consumer makes the package self-contained for "here's how you go from a config stream to a working Hub".

2. **Reduces platform-domain surface area.** Platform-domain is already large (auth, org, user, document store, hosted services). Moving state-management plumbing out keeps it focused on domain modeling.

3. **Enables reuse.** If another domain package (e.g., a standalone clinical-domain app) ever needs to construct a Hub from origin definitions, it could use effectful-store directly without depending on platform-domain.

4. **No current consumers to migrate.** The function is not imported by any app code yet, so the move is free of downstream breakage.

## Cons of moving to effectful-store

1. **Introduces platform-domain types into effectful-store.** The function depends on `Org`, `UserOrg`, `OrgSlug`, `BaseOriginDefinition`, and `OriginType`. Moving it as-is would either (a) create a circular dependency (effectful-store cannot depend on platform-domain) or (b) require moving/duplicating those types into effectful-store, which pollutes a generic package with domain concepts.

2. **`Org` is inherently domain-specific.** The `Org` schema includes fields like `emoji`, `lastRecordingSyncTimestamp`, etc. that have no business in a generic store package. The function reaches into `org.origins` and `userOrg.originConfig` — these are structural assumptions about a particular domain model.

3. **`BaseOriginDefinition` could be generalized, but it's thin.** It's just `{ _tag: string, activeResources: Record<string, true> }` with `onExcessProperty: 'preserve'`. You could define an equivalent interface in effectful-store, but then platform-domain's `BaseOriginDefinition` schema would need to satisfy it, adding a coupling seam for minimal benefit.

4. **effectful-store is currently pure infrastructure.** It has no Schema imports, no domain models, no opinions about where origin definitions come from. `hubStateStream` would be the first thing in the package that cares about "a definition is a tagged struct with activeResources" — a domain-shaped opinion.

5. **The caching logic is tightly coupled to definition shape.** `asEqualityCheckable` wraps `BaseOriginDefinition + originConfig` using `deepDataStruct`. This is a policy decision ("re-create the origin only when its definition changes") that belongs closer to the domain than to generic infrastructure.

## How the move could be done (if desired)

The key challenge is decoupling from `Org`, `UserOrg`, and `OrgSlug`. Here is one approach:

### Option A: Generalize the input

Replace the concrete `Org`/`UserOrg` dependency with a generic interface:

```ts
// In effectful-store
interface OriginDefinitionSource {
  readonly origins: Record<string, { _tag: string; activeResources: Record<string, true>; [key: string]: unknown }>
  readonly originConfigs?: Record<string, Record<string, unknown>>
}

export const hubStateStream = <Resources extends Resource.ResourceSet, R, E>(
  originTypes: readonly { tag: string; make: ... }[],
  sourceStream: Stream<Either<OriginDefinitionSource, E>, never, Scope>
): Stream<Either<Hub.HubState<Resources>, E>, never, R | Scope>
```

Platform-domain would then map its `orgStream` (which carries `Org` + `UserOrg`) into an `OriginDefinitionSource` before passing it in. This keeps effectful-store generic while platform-domain owns the mapping.

**Trade-off:** Adds a mapping step in platform-domain, but it's trivial (`{ origins: org.origins, originConfigs: userOrg?.originConfig }`). The generalized function in effectful-store would not need `Org`, `UserOrg`, `OrgSlug`, or `BaseOriginDefinition`.

### Option B: Keep it in platform-domain

Accept that this is domain-level orchestration code. It takes domain types (`Org`, `UserOrg`) and produces infrastructure types (`HubState`). That's exactly what domain service code does — it sits at the boundary. The current location is correct by the layered architecture rules.

### Option C: Extract only the caching/diffing logic

Move just the `buildHubState` helper (the pure cache-aware state builder) into effectful-store as a generic utility that takes `Record<string, { _tag: string, activeResources: ... }>` + a maker map + a cache, and returns `[cache, HubState]`. Leave `hubStateStream` in platform-domain as the thin wrapper that extracts fields from `Org`/`UserOrg` and calls the generic builder.

## Recommendation

**Keep `hubStateStream` in platform-domain.** The function's core job is to bridge platform-domain models (`Org`, `UserOrg`, `OriginType`) into effectful-store's `HubState`. That bridging logic naturally belongs in the higher-level package (platform-domain) which depends on the lower-level one (effectful-store). Moving it would require either:

- Pulling domain types down into effectful-store (wrong dependency direction), or
- Introducing a generalized interface that adds indirection for a single consumer.

Since there are no other consumers today and the function is small (~70 lines of logic), the cost of the abstraction outweighs the benefit. If a second consumer emerges (e.g., another domain package that also constructs Hubs from origin definitions), **Option C** (extract the generic caching builder) would be the right incremental step at that point.

The current placement follows the dependency rule: domain depends on infrastructure, not the other way around. The function is a domain service that happens to produce infrastructure types — that's normal and correct.
