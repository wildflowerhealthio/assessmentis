# Stage 1: Migrate 5 Simple Detail Pages

**Prerequisites:** Stage 0 complete
**Outcome:** All simple detail pages use Hub directly. No longer reference `clinicalDataRepositoryService`.

## Overview

All 5 pages follow an identical pattern. Convert one at a time, typecheck after each.

## Files (in order)

1. `apps/frontend/app/routes/Patient.$patientId._index.tsx`
2. `apps/frontend/app/routes/Location.$locationId._index.tsx`
3. `apps/frontend/app/routes/Composition.$compositionId._index.tsx`
4. `apps/frontend/app/routes/Observation.$observationId._index.tsx`
5. `apps/frontend/app/routes/Practitioner.$practitionerId._index.tsx`

## Transformation (Patient as representative example)

### Before (current pattern)

```typescript
import { Either, Option, Schema, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'

export default function PatientDetailPage({ params }) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const patientStream = useMemo(() => {
    const patientIdMaybe = tryDecodePatientId(params.patientId)
    return Option.match(patientIdMaybe, {
      onSome: (patientId) =>
        clinicalDataRepositoryService.stream.Patient.pipe(
          StreamEither.mapEffect((repo) => repo.get(patientId))
        ),
      onNone: () =>
        Stream.succeed(
          Either.left(new UnhandledError({ message: 'Patient ID not found' }))
        ),
    })
  }, [clinicalDataRepositoryService, params.patientId])

  const patientPromise = useEitherStream(patientStream)
  // ... rest of component uses patientPromise
}
```

### After (hub pattern)

```typescript
import { Request as EffectRequest, Effect, Option, Schema } from 'effect'
import type { ResourceRequest } from '@assessmentis/effectful-store'
import { useEffectTs } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'
import type { Patient } from '@assessmentis/clinical-domain'

export default function PatientDetailPage({ params }) {
  const { hub } = usePlatformContext()

  const patientEffect = useMemo(() => {
    const patientIdMaybe = tryDecodePatientId(params.patientId)
    return Option.match(patientIdMaybe, {
      onSome: (patientId) =>
        Effect.gen(function* () {
          const origin = yield* hub.getDefaultOrigin('Patient')
          const url = origin.appendToPathname('/Patient/' + patientId)
          return yield* Effect.request(
            EffectRequest.of<ResourceRequest.Get<Patient>>()({
              _tag: 'Get',
              domainType: 'Patient',
              url,
              origin,
            }),
            hub.resolver
          )
        }),
      onNone: () =>
        Effect.fail(
          new UnhandledError({ message: 'Patient ID not found' })
        ),
    })
  }, [hub, params.patientId])

  const patientPromise = useEffectTs(patientEffect)
  // ... rest of component unchanged (still uses patientPromise)
}
```

### Import changes checklist (per file)

- **Remove:** `Stream`, `Either` (if no longer used), `StreamEither` from `@assessmentis/util`, `useEitherStream` from `@assessmentis/react-util`
- **Add:** `Request as EffectRequest` from `effect`, `ResourceRequest` type from `@assessmentis/effectful-store`, `useEffectTs` from `@assessmentis/react-util`
- **Change:** `usePlatformContext()` destructure from `clinicalDataRepositoryService` to `hub`
- **Add:** Import the resource type (e.g., `Patient`) from `@assessmentis/clinical-domain` for the `ResourceRequest.Get<Patient>` type parameter

### Resource type mapping per file

| File | Resource type | domainType string | Route param |
|------|--------------|-------------------|-------------|
| Patient | `Patient` | `'Patient'` | `params.patientId` |
| Location | `Location` | `'Location'` | `params.locationId` |
| Composition | `Composition` | `'Composition'` | `params.compositionId` |
| Observation | `Observation` | `'Observation'` | `params.observationId` |
| Practitioner | `Practitioner` | `'Practitioner'` | `params.practitionerId` |

### Notes

- `useEffectTs` takes `Effect<A, E, Scope.Scope>` and returns `Promise<A>`. An `Effect<A, E, never>` (no dependencies) satisfies this because `never extends Scope.Scope`.
- The `useMemo` dependency array changes from `[clinicalDataRepositoryService, params.xxx]` to `[hub, params.xxx]`.
- The rest of each component (breadcrumbs, Suspense/Await, rendering) is unchanged — it still consumes a `Promise<T>`.

## Verification

After each file:
```bash
npm run typecheck
```

After all 5 files:
```bash
npm run typecheck && npm run test
```
