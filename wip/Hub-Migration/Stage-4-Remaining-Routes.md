# Stage 4: Migrate Remaining Route Pages

**Prerequisites:** Stages 1, 2, 3 complete
**Outcome:** All route pages use Hub. No frontend file references `ClinicalDataRepositoryService`.

## 4a: `apps/frontend/app/routes/Encounter.$encounterId._index.tsx`

`getFullEncounter` now returns `Effect<FullEncounter, E, ClinicalHub>` (from Stage 3e).

**Before:**
```typescript
const { clinicalDataRepositoryService } = usePlatformContext()
const encounterStream = useMemo(() =>
  Option.match(encounterIdMaybe, {
    onSome: (id) => getFullEncounter(id).pipe(
      Stream.provideService(ClinicalDataRepositoryService, clinicalDataRepositoryService)
    ),
    onNone: () => Stream.succeed(Either.left(new NotFoundError({...}))),
  }),
  [params.encounterId, clinicalDataRepositoryService]
)
const encounterPromise = useEitherStream(encounterStream)
```

**After:**
```typescript
const { hub } = usePlatformContext()
const encounterEffect = useMemo(() =>
  Option.match(tryDecodeEncounterId(params.encounterId), {
    onSome: (id) => getFullEncounter(id).pipe(
      Effect.provideService(ClinicalHub, hub)
    ),
    onNone: () => Effect.fail(new NotFoundError({
      resourceType: 'Encounter', params: { id: params.encounterId },
    })),
  }),
  [hub, params.encounterId]
)
const encounterPromise = useEffectTs(encounterEffect)
```

**Import changes:** Remove `Stream`, `Either`, `ClinicalDataRepositoryService`, `useEitherStream`. Add `ClinicalHub`, `useEffectTs`.

---

## 4b: `apps/frontend/app/routes/Encounter.$id.edit.tsx`

Two areas to change:

### Resource loading (lines 29-44)

**Before:** Uses `clinicalDataRepositoryService.stream.Encounter` + `StreamEither.mapEffect(repo.get)` + `useEitherStream`.

**After:** Same `Effect.request(Get)` + `useEffectTs` pattern as Stage 1 detail pages:
```typescript
const { hub } = usePlatformContext()
const encounterEffect = useMemo(() =>
  Option.match(tryDecodeEncounterId(params.id), {
    onSome: (encounterId) =>
      Effect.gen(function* () {
        const origin = yield* hub.getDefaultOrigin('Encounter')
        const url = origin.appendToPathname('/Encounter/' + encounterId)
        return yield* Effect.request(
          EffectRequest.of<ResourceRequest.Get<Encounter>>()({
            _tag: 'Get', domainType: 'Encounter', url, origin,
          }),
          hub.resolver
        )
      }),
    onNone: () => Effect.fail(new UnhandledError({ message: 'Encounter ID not found' })),
  }),
  [hub, params.id]
)
const encounterPromise = useEffectTs(encounterEffect)
```

### Submit handler (lines 101-111)

**Before:** `Effect.provideServiceEffect(EncounterRepository, clinicalDataRepositoryService.effect.Encounter)`

**After:** `Effect.provideService(ClinicalHub, hub)`

```typescript
await Effect.runPromise(
  updateEncounter(encounter, data).pipe(
    Effect.provideService(ClinicalHub, hub)
  )
)
```

**Remove:** `EncounterRepository` import, `ClinicalDataRepositoryService` import, `StreamEither`, `Stream`, `Either`, `useEitherStream`.
**Add:** `ClinicalHub`, `EffectRequest`, `ResourceRequest`, `useEffectTs`.

---

## 4c: `apps/frontend/app/routes/Encounter.new.tsx`

**Before (lines 82-99):** Provides 4 repository services via `Effect.provideServiceEffect`:
```typescript
createEncounter({...}).pipe(
  Effect.provideServiceEffect(QuestionnaireResponseRepository, clinicalDataRepositoryService.effect.QuestionnaireResponse),
  Effect.provideServiceEffect(EncounterRepository, clinicalDataRepositoryService.effect.Encounter),
  Effect.provideServiceEffect(VideoCallClient, VideoCallClientService.client),
  Effect.provideServiceEffect(LocationRepository, clinicalDataRepositoryService.effect.Location),
)
```

**After:** Single `Effect.provideService(ClinicalHub, hub)` plus VideoCallClient:
```typescript
const { hub, VideoCallClientService } = usePlatformContext()
// ...
createEncounter({...}).pipe(
  Effect.provideService(ClinicalHub, hub),
  Effect.provideServiceEffect(VideoCallClient, VideoCallClientService.client),
)
```

**Remove:** `QuestionnaireResponseRepository`, `EncounterRepository`, `LocationRepository` imports from `@assessmentis/clinical-domain/repositories`.
**Add:** `ClinicalHub` import.

---

## 4d: `apps/frontend/app/routes/QuestionnaireResponse.$questionnaireResponseId.tsx`

Most complex route. Three areas:

### 1. `questionnaireEffect()` function (lines 46-97)

**Before:** Yields `ObservationRepository`, `QuestionnaireResponseRepository`, `QuestionnaireRepository`, calls `repo.get()`, `repo.getMany()`.

**After:** Yields `ClinicalHub`, uses `Effect.request`:

```typescript
function questionnaireEffect(questionnaireResponseIdStr: string) {
  return Effect.gen(function* () {
    const hub = yield* ClinicalHub

    const questionnaireResponseId = yield* tryDecodeQuestionnaireResponseId(
      questionnaireResponseIdStr
    ).pipe(
      Option.map(Effect.succeed),
      Option.getOrElse(() =>
        Effect.fail(new UnhandledError({ message: 'Questionnaire Response not found' }))
      )
    )

    // Get QR by ID
    const qrOrigin = yield* hub.getDefaultOrigin('QuestionnaireResponse')
    const qrUrl = qrOrigin.appendToPathname('/QuestionnaireResponse/' + questionnaireResponseId)
    const questionnaireResponse = yield* Effect.request(
      EffectRequest.of<ResourceRequest.Get<QuestionnaireResponse>>()({
        _tag: 'Get', domainType: 'QuestionnaireResponse', url: qrUrl, origin: qrOrigin,
      }),
      hub.resolver
    )

    // Derive encounter ID and get recordings
    const encounterId = questionnaireResponse.encounter?.reference?.split('/')[1] ?? undefined
    const recordings = encounterId
      ? yield* getEncounterRecordings(encounterId).pipe(Effect.provideService(ClinicalHub, hub))
      : []

    // Get questionnaire by ID
    const questionnaireId = questionnaireResponse.questionnaire?.split('/')[3]
      ?? questionnaireResponse.questionnaire ?? ''
    const qOrigin = yield* hub.getDefaultOrigin('Questionnaire')
    const qUrl = qOrigin.appendToPathname('/Questionnaire/' + questionnaireId)
    const questionnaire = yield* Effect.request(
      EffectRequest.of<ResourceRequest.Get<Questionnaire>>()({
        _tag: 'Get', domainType: 'Questionnaire', url: qUrl, origin: qOrigin,
      }),
      hub.resolver
    )

    // Search observations
    const observations = yield* Effect.request(
      EffectRequest.of<ResourceRequest.Search<Observation>>()({
        _tag: 'Search', domainType: 'Observation',
        params: { encounter: `Encounter/${encounterId}` },
        origin: null,
      }),
      hub.resolver
    )

    return { questionnaireResponse, questionnaire, recordings, observations }
  })
}
```

### 2. `pageEffect` (lines 104-116)

**Before:** 4 `provideServiceEffect` calls.
**After:**
```typescript
const pageEffect = useMemo(() =>
  questionnaireEffect(params.questionnaireResponseId).pipe(
    Effect.provideService(ClinicalHub, hub)
  ),
  [hub, params.questionnaireResponseId]
)
```

### 3. `ResponsePage` component (lines 133-335)

**`useClinicalDataCollection` call (line 170-173):**

**Before:**
```typescript
const repoEffect = useMemo(() =>
  Effect.gen(function*() {
    const repoService = yield* ClinicalDataRepositoryService
    return yield* repoService.effect.Media
  }).pipe(Effect.provideService(ClinicalDataRepositoryService, clinicalDataRepositoryService)),
  [clinicalDataRepositoryService]
)
const { collection, deleteItem: deleteMedia } = useClinicalDataCollection(repoEffect, recordings)
```

**After:** (uses updated `useClinicalDataCollection` from Stage 2b)
```typescript
const { hub } = usePlatformContext()
const { collection, deleteItem: deleteMedia } = useClinicalDataCollection(hub, 'Media', recordings)
```

**`syncObservations` (lines 175-205):**

**Before:** `ObservationRepository.pipe(Effect.flatMap(o => o.createMany(observations)), Effect.provideServiceEffect(ObservationRepository, clinicalDataRepositoryService.effect.Observation))`

**After:**
```typescript
const syncObservations = () => {
  // ... existing observation extraction logic ...
  const observationOrigin = Effect.runPromise(hub.getDefaultOrigin('Observation'))
  return observationOrigin.then((origin) =>
    Effect.runPromise(
      Effect.forEach(
        observations,
        (obs) =>
          Effect.request(
            EffectRequest.of<ResourceRequest.Create<Observation>>()({
              _tag: 'Create', domainType: 'Observation', resource: obs, origin,
            }),
            hub.resolver
          ),
        { concurrency: 'unbounded' }
      )
    )
  ).then(data => console.log('Synced:', data))
   .catch(error => console.error('Failed:', error))
}
```

**`syncVideo` (lines 208-232):**

**Before:** 3 `provideServiceEffect` calls (MediaRepository, VideoCallClient, EncounterRepository).

**After:**
```typescript
const updateEffect = updateEncounterRecordingsAndTranscripts(encounterId).pipe(
  Effect.provideService(ClinicalHub, hub),
  Effect.provideServiceEffect(VideoCallClient, VideoCallClientService.client),
)
```

**Remove all imports of:** `ObservationRepository`, `QuestionnaireRepository`, `QuestionnaireResponseRepository`, `MediaRepository`, `EncounterRepository` from `@assessmentis/clinical-domain/repositories`, and `ClinicalDataRepositoryService`.

---

## 4e: `apps/frontend/app/modules/resources/Questionnaire/features/QuestionnaireForm/QuestionnaireForm.tsx`

**Before (lines 26, 31-48):** Gets `clinicalDataRepositoryService` from context, yields `QuestionnaireResponseRepository`, calls `repo.update()`.

**After:**
```typescript
const { hub } = usePlatformContext()

useAutoSave({
  data: questionnaireResponse,
  onSave: async (data) => {
    if (!hasId(data) || !data.url) return
    await Effect.runPromise(
      Effect.gen(function* () {
        const origin = yield* hub.getOriginUrlForResource(data.url)
        yield* Effect.request(
          EffectRequest.of<ResourceRequest.Update<QuestionnaireResponse>>()({
            _tag: 'Update', domainType: 'QuestionnaireResponse', resource: data, origin,
          }),
          hub.resolver
        )
      })
    )
  },
  delay: 5000,
})
```

**Remove:** `QuestionnaireResponseRepository` import, `ClinicalDataRepositoryService`-related code.

---

## Verification

```bash
npm run typecheck && npm run test
```

After this stage, no file in `apps/frontend/app/` should reference `ClinicalDataRepositoryService` or any individual repository tag from `@assessmentis/clinical-domain/repositories`. Verify:

```bash
grep -r "ClinicalDataRepositoryService\|clinicalDataRepositoryService" apps/frontend/app/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".bak" | grep -v ".test."
```

Should only return the service definition file itself (`ClinicalDataRepositoriesService.ts`) and possibly test files. These are removed in Stage 5.
