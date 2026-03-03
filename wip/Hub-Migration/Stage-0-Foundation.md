# Stage 0: Foundation — Expose Hub & Add Missing Methods

**Prerequisites:** None
**Outcome:** Hub is accessible to frontend consumers via `PlatformContext.hub` and `ClinicalHub` Effect.Tag. Both old and new paths coexist.

## Files to Modify

### 1. `global/effectful-store/src/Hub.ts` — Add two methods to Hub class

Add `getDefaultOrigin` — reads hub state, returns `originUrl` of first origin where `activeResources[domainType]` is true and `errorStatus` is undefined. Fails with `UnhandledError` if none found.

```typescript
getDefaultOrigin(domainType: string): Effect.Effect<ReadonlyUrl, UnhandledError> {
  return Effect.gen(this, function*() {
    const originStates = yield* SubscriptionRef.get(this.originStatesRef)
    for (const origin of originStates.values()) {
      if (origin.activeResources[domainType] && !origin.errorStatus) {
        return origin.originUrl
      }
    }
    return yield* Effect.fail(
      new UnhandledError({
        message: `No ready origin found for resource type ${domainType}`,
      })
    )
  })
}
```

Add `getOriginUrlForResource` — reads hub state, returns `originUrl` of first origin where `origin.originUrl.hasChild(url)` is true. Fails with `UnhandledError` if none matches.

```typescript
getOriginUrlForResource(url: ReadonlyUrl): Effect.Effect<ReadonlyUrl, UnhandledError> {
  return Effect.gen(this, function*() {
    const originStates = yield* SubscriptionRef.get(this.originStatesRef)
    for (const origin of originStates.values()) {
      if (origin.originUrl.hasChild(url)) {
        return origin.originUrl
      }
    }
    return yield* Effect.fail(
      new UnhandledError({
        message: `No origin found owning URL ${url.toString()}`,
      })
    )
  })
}
```

Both methods need `ReadonlyUrl` imported (already used in the file via `OriginState`).

### 2. `global/effectful-store/src/Hub.test.ts` — Tests for new methods

Follow existing property-based testing patterns. Use `arbitraryReadyOrigin` and `arbitraryNotReadyOrigin` helpers already defined in the test file. Key test cases:

- `getDefaultOrigin` returns the first ready origin supporting the requested type
- `getDefaultOrigin` fails with `UnhandledError` when no origin supports the type
- `getDefaultOrigin` skips origins in error state (not-ready)
- `getOriginUrlForResource` finds the right origin by URL prefix match (`hasChild`)
- `getOriginUrlForResource` fails when no origin matches

### 3. `apps/frontend/app/layers/PlatformContext.tsx` — Add hub to interface

Add `hub` alongside existing `clinicalDataRepositoryService` (both coexist during migration):

```typescript
import type { Hub } from '@assessmentis/effectful-store'
import type { ResourceDataTypes } from '@assessmentis/clinical-domain'

export interface PlatformContext {
  // ... existing fields stay ...
  hub: Hub.Hub<ResourceDataTypes>
}
```

### 4. `apps/frontend/app/layers/PlatformContextProvider.tsx` — Fix import

Line 39 currently uses a relative path:
```typescript
import { makeHub } from '../../../../global/effectful-store/src/Hub'
```

Change to package import:
```typescript
import { Hub } from '@assessmentis/effectful-store'
```

And update usage from `makeHub<ResourceDataTypes>()` to `Hub.makeHub<ResourceDataTypes>()`.

The hub is already in the return object (line 84: `hub,`), so no other changes needed. The `PlatformContext.Provider` receives the full return value.

### 5. Create `apps/frontend/app/layers/ClinicalHub.ts` (new file)

```typescript
import { Context } from 'effect'
import type { Hub } from '@assessmentis/effectful-store'
import type { ResourceDataTypes } from '@assessmentis/clinical-domain'

export class ClinicalHub extends Context.Tag('ClinicalHub')<
  ClinicalHub,
  Hub.Hub<ResourceDataTypes>
>() {}
```

This tag is used by domain actions to declare their Hub dependency in the Effect type system. Route components provide it via `Effect.provideService(ClinicalHub, hub)`.

### 6. `apps/frontend/app/test-utils.ts` — Add hub mock

Add `hub` to `createMockPlatformContext` alongside existing `clinicalDataRepositoryService`:

```typescript
hub: overrides.hub ?? neverUsedMock('hub'),
```

Also add `hub` to the overrides type parameter.

## Verification

```bash
npm run typecheck && npm run test
```

All existing tests should pass unchanged. New Hub tests should pass.
