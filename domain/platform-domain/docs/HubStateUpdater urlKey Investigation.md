# HubStateUpdater urlKey Investigation

## Description of the issue

In `HubStateUpdater.ts`, the `buildHubState` function maintains two `Map`s:

- `newCache` — keyed by `urlKey`, used to avoid re-running makers when definitions haven't changed
- `state` — keyed by URL string, becomes the `HashMap<string, Origin.AnyState>` (i.e. the `HubState`)

The three branches in the iteration loop (lines 89-112) use inconsistent keys for the `state` map:

| Branch | `newCache` key | `state` key |
|--------|---------------|-------------|
| Cache hit (line 92) | `urlKey` | `urlKey` |
| Maker called (line 98) | `urlKey` | `origin.originUrl.toString()` |
| Error fallback (line 111) | `urlKey` | `urlKey` |

Only the maker branch uses `origin.originUrl.toString()` instead of `urlKey`.

## How `urlKey` is derived

```
org.origins  →  Record<UriEncodedOriginUrl, BaseOriginDefinition>
                  ↓ (Record.toEntries)
url = UriEncodedOriginUrl  (percent-encoded string, e.g. "https%3A%2F%2Fexample.com")
                  ↓ (ReadonlyUrl.fromEncoded)
originUrl = ReadonlyUrl    (decodes via decodeURIComponent, then parses via new URL())
                  ↓ (.toString())
urlKey = string            (reconstructs via new URL().href — normalized)
```

`urlKey` is always the `new URL(...).href` of the decoded origin URL. The `URL` constructor applies WHATWG URL normalization: trailing slash on bare hostnames, port normalization, percent-encoding normalization, etc.

## How `origin.originUrl.toString()` behaves

The maker (an `OriginType.make` implementation) receives a `BaseOriginDefinition` and returns an `Origin.AnyState<Resources, never>`, which includes an `originUrl: ReadonlyUrl` field. `ReadonlyUrl.toString()` does the same reconstruction: `new URL(\`${this.protocol}//${this.host}${this.pathname}\`).href`.

The critical question is: does the maker's returned `originUrl` always match `urlKey`?

## Is this a real bug?

**Yes, this is a latent bug**, though it cannot currently be triggered because no production `OriginType` implementations exist yet (only test mocks). Here is why it is a real concern:

### 1. The `OriginType.make` contract does not constrain `originUrl`

The `OriginType` interface (in `models/OriginType.ts`) defines `make` as:

```ts
readonly make: (
  definition: BaseOriginDefinition,
  originConfig: Record<string, unknown> | undefined
) => Effect.Effect<Origin.AnyState<Resources, never>, never, R | Scope.Scope>
```

The `BaseOriginDefinition` does not carry the origin URL at all — it only has `_tag` and `activeResources`. The maker receives no indication of what URL the origin is expected to live at. It must construct the `originUrl` from its own knowledge (e.g., from extra fields preserved via `onExcessProperty: 'preserve'`).

There is nothing preventing a maker from constructing a `ReadonlyUrl` with a differently-normalized URL than the one used as the Record key in `org.origins`.

### 2. Cache/state divergence

If a maker returns an origin with `originUrl.toString() !== urlKey`:

- **`newCache`** stores the entry under `urlKey`
- **`state`** (which becomes `HubState`) stores it under `origin.originUrl.toString()`

On the next emission with the same org data:
- The cache lookup at line 89 finds the entry by `urlKey`
- If the definition hasn't changed, the cache hit branch (line 92) puts the state under `urlKey`
- This means the HubState key **changes between emissions** — first emission uses the maker's URL, subsequent cached emissions use `urlKey`

### 3. Downstream impact

The `HubState` HashMap is consumed by:

- `origin-resolution.ts:50` — `HashMap.get(originUrl)` to await a specific origin becoming ready
- `pipeline.ts:85` — `HashMap.get(originStates, key)` to route requests to origins

If the key silently changes between the first and subsequent emissions, downstream lookups could fail intermittently — the origin would be found on first load but potentially under a different key after cache kicks in, or vice versa.

### 4. Why the tests don't catch it

Every test mock constructs `originUrl` using `ReadonlyUrl.fromEncoded(encode(url))` with the same URL string used as the `org.origins` key. This means `origin.originUrl.toString()` always equals `urlKey` in tests.

## Recommendations

### Primary fix: use `urlKey` consistently (preferred)

Change line 98 from:

```ts
state.set(origin.originUrl.toString(), origin)
```

to:

```ts
state.set(urlKey, origin)
```

This is the simplest fix and makes the maker branch consistent with the other two branches. The `urlKey` is derived from the canonical org data (the `org.origins` Record key), so it is the authoritative identifier.

### Secondary consideration: pass the origin URL to makers

The `OriginType.make` signature does not currently receive the origin URL. Consider extending it to pass `originUrl: ReadonlyUrl` so makers don't have to reconstruct it independently:

```ts
readonly make: (
  originUrl: ReadonlyUrl,
  definition: BaseOriginDefinition,
  originConfig: Record<string, unknown> | undefined
) => Effect.Effect<Origin.AnyState<Resources, never>, never, R | Scope.Scope>
```

This would make it natural for makers to use the canonical URL and reduce the risk of divergence, though it is a larger API change.

### Add a regression test

Add a test where the maker returns an origin with a differently-normalized `originUrl` (e.g., without trailing slash when the canonical URL has one) and verify the HubState key remains consistent across cached and uncached emissions.
