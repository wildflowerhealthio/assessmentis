# Stage 3: Migrate Domain Actions

**Prerequisites:** Stage 0 complete
**Outcome:** All frontend domain actions use `ClinicalHub` + `Effect.request` instead of individual repository tags. Their callers are updated in Stage 4.

## General Pattern

**Before:** Domain actions yield individual repository tags (`EncounterRepository`, `MediaRepository`, etc.) and call methods like `repo.get()`, `repo.create()`, `repo.getMany()`.

**After:** Domain actions yield `ClinicalHub`, use `Effect.request` with the hub resolver. The requirement type changes from `EncounterRepository | MediaRepository | ...` to `ClinicalHub`.

Callers change from multiple `Effect.provideServiceEffect(XxxRepository, clinicalDataRepositoryService.effect.Xxx)` calls to a single `Effect.provideService(ClinicalHub, hub)`.

---

## 3a: `apps/frontend/app/modules/resources/Encounter/actions/createEncounter.ts`

**Before requirement:** `EncounterRepository | QuestionnaireResponseRepository | VideoCallClient | LocationRepository`
**After requirement:** `ClinicalHub | VideoCallClient`

### Key changes

1. Replace `yield* EncounterRepository` / `yield* LocationRepository` / `yield* QuestionnaireResponseRepository` with `const hub = yield* ClinicalHub`

2. `locationRepository.create(...)` becomes:
```typescript
const locationOrigin = yield* hub.getDefaultOrigin('Location')
const videoRoomLocation = yield* Effect.request(
  EffectRequest.of<ResourceRequest.Create<Location>>()({
    _tag: 'Create', domainType: 'Location', resource: Location.make({...}), origin: locationOrigin,
  }),
  hub.resolver
)
```

3. `encounterRepository.create(encounterData)` becomes:
```typescript
const encounterOrigin = yield* hub.getDefaultOrigin('Encounter')
const createdEncounter = yield* Effect.request(
  EffectRequest.of<ResourceRequest.Create<Encounter>>()({
    _tag: 'Create', domainType: 'Encounter', resource: encounterData, origin: encounterOrigin,
  }),
  hub.resolver
)
```

4. `questionnaireResponseRepository.createMany(items)` (line 123-133) becomes `Effect.forEach`:
```typescript
const qrOrigin = yield* hub.getDefaultOrigin('QuestionnaireResponse')
const questionnaireResponseRows = yield* Effect.forEach(
  qrPayloads,
  (qr) =>
    Effect.request(
      EffectRequest.of<ResourceRequest.Create<QuestionnaireResponse>>()({
        _tag: 'Create', domainType: 'QuestionnaireResponse', resource: qr, origin: qrOrigin,
      }),
      hub.resolver
    ),
  { concurrency: 'unbounded' }
)
```

### Imports

**Remove:** `EncounterRepository`, `LocationRepository`, `QuestionnaireResponseRepository` from `@assessmentis/clinical-domain/repositories`
**Add:** `ClinicalHub` from `../../../layers/ClinicalHub`, `Request as EffectRequest` from `effect`, `ResourceRequest` from `@assessmentis/effectful-store`

---

## 3b: `apps/frontend/app/modules/resources/Encounter/actions/updateEncounter.ts`

**Before requirement:** `EncounterRepository`
**After requirement:** `ClinicalHub`

Replace `yield* EncounterRepository` + `repo.update(encounter)` with:
```typescript
const hub = yield* ClinicalHub
const origin = yield* hub.getOriginUrlForResource(encounter.url)
return yield* Effect.request(
  EffectRequest.of<ResourceRequest.Update<Encounter>>()({
    _tag: 'Update', domainType: 'Encounter', resource: encounter, origin,
  }),
  hub.resolver
)
```

Read this file first to confirm exact structure before editing.

---

## 3c: `apps/frontend/app/modules/resources/Encounter/actions/getEncounterRecordings.ts`

**Before requirement:** `MediaRepository`
**After requirement:** `ClinicalHub`

Replace `yield* MediaRepository` + `repo.getMany({ encounter: ... })` with:
```typescript
const hub = yield* ClinicalHub
return yield* Effect.request(
  EffectRequest.of<ResourceRequest.Search<Media>>()({
    _tag: 'Search', domainType: 'Media',
    params: { encounter: `Encounter/${encounterId}` },
    origin: null,
  }),
  hub.resolver
)
```

---

## 3d: `apps/frontend/app/modules/resources/Encounter/actions/updateEncounterRecordingsAndTranscripts.ts`

**Before requirement:** `EncounterRepository | MediaRepository | VideoCallClient`
**After requirement:** `ClinicalHub | VideoCallClient`

### Key changes

1. Replace `yield* EncounterRepository` and `yield* MediaRepository` with `const hub = yield* ClinicalHub`

2. `encounterRepository.get(encounterId)` (line 42):
```typescript
const encounterOrigin = yield* hub.getDefaultOrigin('Encounter')
const encounterUrl = encounterOrigin.appendToPathname('/Encounter/' + encounterId)
const encounter = yield* Effect.request(
  EffectRequest.of<ResourceRequest.Get<Encounter>>()({
    _tag: 'Get', domainType: 'Encounter', url: encounterUrl, origin: encounterOrigin,
  }),
  hub.resolver
)
```

3. `mediaRepository.getMany({ encounter: ... })` (line 55-57):
```typescript
const knownMediaItems = yield* Effect.request(
  EffectRequest.of<ResourceRequest.Search<Media>>()({
    _tag: 'Search', domainType: 'Media',
    params: { encounter: `Encounter/${encounterId}` },
    origin: null,
  }),
  hub.resolver
)
```

4. `mediaRepository.update(media)` (line 91):
```typescript
const mediaOrigin = yield* hub.getOriginUrlForResource(media.url)
yield* Effect.request(
  EffectRequest.of<ResourceRequest.Update<Media>>()({
    _tag: 'Update', domainType: 'Media', resource: media, origin: mediaOrigin,
  }),
  hub.resolver
)
```

5. `mediaRepository.createMany(mediaToCreate)` (line 104):
```typescript
const mediaCreateOrigin = yield* hub.getDefaultOrigin('Media')
yield* Effect.forEach(
  mediaToCreate,
  (media) =>
    Effect.request(
      EffectRequest.of<ResourceRequest.Create<Media>>()({
        _tag: 'Create', domainType: 'Media', resource: media, origin: mediaCreateOrigin,
      }),
      hub.resolver
    ),
  { concurrency: 'unbounded' }
)
```

---

## 3e: `apps/frontend/app/modules/interview-call/actions/getFullEncounter.ts`

**This is the most complex single migration.** Converts from `Stream<Either<FullEncounter, ...>>` to `Effect<FullEncounter, ...>`.

**Before:** Returns `Stream<Either<FullEncounter, E>, never, ClinicalDataRepositoryService | Scope>` using `StreamEither.zipLatest` across 4 repository streams, with nested `StreamEither.mapEffect` blocks.

**After:** Returns `Effect<FullEncounter, E, ClinicalHub>` using a single `Effect.gen`:

```typescript
import { ClinicalHub } from '../../../layers/ClinicalHub'
import { Request as EffectRequest, Effect, Option } from 'effect'
import type { ResourceRequest } from '@assessmentis/effectful-store'

export const getFullEncounter = (
  encounterId: string
): Effect.Effect<
  FullEncounter,
  | UnhandledError | AuthError | AuthzError
  | NotFoundError<'Encounter', { url: string }>
  | NotFoundError<'Location', { url: string }>
  | ExternalAssertionError,
  ClinicalHub
> =>
  Effect.gen(function* () {
    const hub = yield* ClinicalHub

    // Get encounter
    const encounterOrigin = yield* hub.getDefaultOrigin('Encounter')
    const encounterUrl = encounterOrigin.appendToPathname('/Encounter/' + encounterId)
    const encounter = yield* Effect.request(
      EffectRequest.of<ResourceRequest.Get<Encounter>>()({
        _tag: 'Get', domainType: 'Encounter', url: encounterUrl, origin: encounterOrigin,
      }),
      hub.resolver
    )

    // Get locations referenced by encounter
    const locationOrigin = yield* hub.getDefaultOrigin('Location')
    const locationIds = (encounter.location ?? [])
      .map((l: EncounterLocation) => extractReferenceId(l.location))
      .filter((id: string | undefined): id is string => !!id)
    const _locations = yield* Effect.all(
      locationIds.map((id: string) =>
        Effect.request(
          EffectRequest.of<ResourceRequest.Get<Location>>()({
            _tag: 'Get', domainType: 'Location',
            url: locationOrigin.appendToPathname('/Location/' + id),
            origin: locationOrigin,
          }),
          hub.resolver
        )
      )
    )

    // Search questionnaires and questionnaire responses
    const allQuestionnaires = yield* Effect.request(
      EffectRequest.of<ResourceRequest.Search<Questionnaire>>()({
        _tag: 'Search', domainType: 'Questionnaire', params: {}, origin: null,
      }),
      hub.resolver
    )
    const responses = yield* Effect.request(
      EffectRequest.of<ResourceRequest.Search<QuestionnaireResponse>>()({
        _tag: 'Search', domainType: 'QuestionnaireResponse',
        params: { encounter: `Encounter/${encounterId}` },
        origin: null,
      }),
      hub.resolver
    )

    // Join QRs with questionnaires (same logic as current code, lines 100-130)
    const questionnaireResponses = yield* Effect.all(
      responses.map((qr) =>
        Option.fromNullable(
          allQuestionnaires.find((q) => q.url?.toString() === qr.questionnaire)
        ).pipe(
          Option.map((_questionnaire) =>
            Effect.succeed({ ...qr, _questionnaire })
          ),
          Option.getOrElse(() =>
            Effect.fail(
              new UnhandledError({
                message: `Questionnaire Response's Questionnaire '${qr.questionnaire}' could not be found`,
              })
            )
          )
        )
      )
    )

    return { ...encounter, _locations, questionnaireResponses }
  })
```

**Remove:** `Stream`, `Either`, `StreamEither`, `Scope`. All `StreamEither.zipLatest`, `StreamEither.zipLatestWith`, `StreamEither.mapEffect`, `Stream.unwrap` patterns removed.
**Remove:** `NoSelectedOrgError` from error union (Hub reports this as `UnhandledError`).

### Impact on caller

`Encounter.$encounterId._index.tsx` must be updated in Stage 4a to use `Effect` instead of `Stream`.

---

## Verification

```bash
npm run typecheck && npm run test
```

Note: The callers of these actions (route pages) still use the old pattern at this point. They will be updated in Stage 4. During this intermediate state, typechecking may show errors in the caller files — this is expected and resolved in Stage 4.

**Alternative:** If you prefer no intermediate type errors, do Stage 3e + Stage 4a together (getFullEncounter + Encounter detail page), and similarly pair other actions with their callers.
