# Stage 2: Migrate Shared CRUD Infrastructure

**Prerequisites:** Stage 0 complete
**Outcome:** All shared hooks, utility factories, config types, and generic page components use Hub. The `ClinicalDataRepositoryService` Effect.Tag is no longer a dependency of create/update actions or generic pages.

## 2a: `apps/frontend/app/modules/common/actions/createResourceActions.ts`

### createResourceCreateAction

**Before:** Yields `ClinicalDataRepositoryService`, gets repo via `service.repositoryEffect(resourceType)`, calls `repo.create(resource)`.

**After:** Yields `ClinicalHub`, gets origin via `hub.getDefaultOrigin(resourceType)`, calls `Effect.request(Create)`.

```typescript
import { ClinicalHub } from '../../../layers/ClinicalHub'
import { Request as EffectRequest, Effect } from 'effect'
import type { ResourceRequest } from '@assessmentis/effectful-store'

export function createResourceCreateAction<TFormData, Key extends keyof ResourceDataTypes>(
  resourceType: Key,
  transform: (data: TFormData) => ResourceDataTypes[Key]
): (formData: TFormData) => Effect.Effect<
  Resource.WithResourceUrl<ResourceDataTypes[Key]>,
  ResourceRequest.CommonErrors,
  ClinicalHub
> {
  return (formData) =>
    Effect.gen(function* () {
      const hub = yield* ClinicalHub
      const origin = yield* hub.getDefaultOrigin(resourceType)
      const resource = transform(formData)
      return yield* Effect.request(
        EffectRequest.of<ResourceRequest.Create<ResourceDataTypes[Key]>>()({
          _tag: 'Create',
          domainType: resourceType,
          resource,
          origin,
        }),
        hub.resolver
      )
    })
}
```

**Error type change:** `ClinicalDataRepositoryErrors | NoSelectedOrgError` becomes `ResourceRequest.CommonErrors`. The Hub reports "no origin found" as `UnhandledError` (which is included in `CommonErrors`), replacing the previous `NoSelectedOrgError`.

### createResourceUpdateAction

Same pattern. Yields `ClinicalHub`, uses `hub.getOriginUrlForResource(url)` to find the origin, then `Effect.request(Update)`.

```typescript
export function createResourceUpdateAction<TFormData, Key extends keyof ResourceDataTypes>(
  resourceType: Key,
  transform: (data: TFormData) => Omit<ResourceDataTypes[Key], ''>
): (url: ReadonlyUrl, current: ResourceDataTypes[Key], formData: TFormData) => Effect.Effect<
  ResourceDataTypes[Key],
  ResourceRequest.CommonErrors | NotFoundError<ResourceDataTypes[Key]['domainType'], { url: ReadonlyUrl }>,
  ClinicalHub
> {
  return (url, current, formData) =>
    Effect.gen(function* () {
      const hub = yield* ClinicalHub
      const origin = yield* hub.getOriginUrlForResource(url)
      const updatedFields = transform(formData)
      const updated = { ...current, ...updatedFields, url }
      return yield* Effect.request(
        EffectRequest.of<ResourceRequest.Update<ResourceDataTypes[Key]>>()({
          _tag: 'Update',
          domainType: resourceType,
          resource: updated,
          origin,
        }),
        hub.resolver
      )
    })
}
```

**Remove:** Import of `ClinicalDataRepositoryService`. **Add:** Import of `ClinicalHub`, `EffectRequest`, `ResourceRequest`.

---

## 2b: `apps/frontend/app/modules/common/hooks/useClinicalDataCollection.tsx`

### Signature change

**Before:** Takes `repoEffect: Effect<ClinicalDataRepository<T>, E, never>`.
**After:** Takes `hub: Hub.Hub<ResourceDataTypes>` and `domainType: string`.

```typescript
import type { Hub, ResourceRequest } from '@assessmentis/effectful-store'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import { Request as EffectRequest, Effect, Schema } from 'effect'

type AnyResource = Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>

const actions = <T extends AnyResource & { url?: ReadonlyUrl; domainType: string }>(
  hub: Hub.Hub<ResourceDataTypes>,
  domainType: string
) => ({
  apiDelete: async (urlKey: string) => {
    const url = Schema.decodeSync(ReadonlyUrl.FromString)(urlKey)
    await Effect.runPromise(
      Effect.gen(function* () {
        const origin = yield* hub.getOriginUrlForResource(url)
        yield* Effect.request(
          EffectRequest.of<ResourceRequest.Delete<T>>()({
            _tag: 'Delete', domainType, resource: { url }, origin,
          }),
          hub.resolver
        )
      })
    )
  },
  apiCreate: (t: T): Promise<T> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const origin = yield* hub.getDefaultOrigin(domainType)
        return yield* Effect.request(
          EffectRequest.of<ResourceRequest.Create<T>>()({
            _tag: 'Create', domainType, resource: t, origin,
          }),
          hub.resolver
        )
      })
    ),
})

export function useClinicalDataCollection<T extends AnyResource & { url?: ReadonlyUrl; domainType: string }>(
  hub: Hub.Hub<ResourceDataTypes>,
  domainType: string,
  data: ReadonlyArray<T>
) {
  return useCollection<T>(actions<T>(hub, domainType), data, urlKeyOf)
}

export function useClinicalDataCollectionPromise<T extends AnyResource & { url?: ReadonlyUrl; domainType: string }>(
  hub: Hub.Hub<ResourceDataTypes>,
  domainType: string,
  dataPromise: Promise<ReadonlyArray<T>>
) {
  return useCollectionPromise<T>(actions<T>(hub, domainType), dataPromise, urlKeyOf)
}
```

**All callers of useClinicalDataCollection / useClinicalDataCollectionPromise must be updated to pass hub + domainType instead of repoEffect.** This affects:
- `createResourceCollectionHook.ts` (Stage 2d)
- `QuestionnaireResponse.$questionnaireResponseId.tsx` (Stage 4d)

---

## 2c: `apps/frontend/app/modules/common/components/BasePicker/hooks/usePickerData.ts`

**Before:** Gets `ClinicalDataRepositoryService` via `yield* ClinicalDataRepositoryService` in Effect.gen, accesses `service.stream[resourceType]`, pipes through `StreamEither.mapEffect(repo => repo.getMany())`.

**After:** Gets `hub` from `usePlatformContext()`, uses `Effect.request(Search)` + `useEffectTs`:

```typescript
import { Request as EffectRequest, Effect } from 'effect'
import type { ResourceRequest } from '@assessmentis/effectful-store'
import { useEffectTs } from '@assessmentis/react-util'
import { usePlatformContext } from '../../../../../layers/PlatformContext'

export function usePickerData<T, O>(options: UsePickerDataOptions<T, O>): UsePickerDataResult<O> {
  const { resourceType, transform, enabled = true } = options
  const { hub } = usePlatformContext()
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const itemsEffect = useMemo(
    () =>
      enabled
        ? Effect.request(
            EffectRequest.of<ResourceRequest.Search<T>>()({
              _tag: 'Search',
              domainType: resourceType,
              params: {},
              origin: null,
            }),
            hub.resolver
          ).pipe(Effect.map((resources) => resources.map(transform)))
        : Effect.fail({ _tag: 'Disabled' } as const),
    [hub, refetchTrigger, enabled, resourceType, transform]
  )

  const itemsPromise = useEffectTs(itemsEffect)
  const refetch = () => setRefetchTrigger((prev) => prev + 1)

  return [itemsPromise, refetch]
}
```

**Remove:** `ClinicalDataRepositoryService`, `ClinicalDataRepositoryServiceType`, `Stream`, `Either`, `StreamEither`, `useEitherStream`, `Scope`. **Add:** `EffectRequest`, `ResourceRequest`, `useEffectTs`.

---

## 2d: `apps/frontend/app/modules/common/utils/createResourceCollectionHook.ts`

**Before:** Uses `clinicalDataRepositoryService.repositoryStream(type)` + `StreamEither.mapEffect(repo => repo.getMany(filters))` + `useEitherStream`.

**After:** Uses `hub` from `usePlatformContext()`, `Effect.request(Search)` + `useEffectTs`, passes `hub` + `domainType` to updated `useClinicalDataCollectionPromise`:

```typescript
export function createResourceCollectionHook<TResource>(config: { resourceType: TResource['domainType'] }) {
  return (filters?: RepositoryFilters<TResource>) => {
    const { hub } = usePlatformContext()

    const searchEffect = useMemo(
      () =>
        Effect.request(
          EffectRequest.of<ResourceRequest.Search<TResource>>()({
            _tag: 'Search',
            domainType: config.resourceType,
            params: filters ?? {},
            origin: null,
          }),
          hub.resolver
        ),
      [hub, config.resourceType, filters]
    )

    const resourcesPromise = useEffectTs(searchEffect)

    return useClinicalDataCollectionPromise<TResource>(
      hub,
      config.resourceType,
      resourcesPromise
    )
  }
}
```

---

## 2e: `apps/frontend/app/modules/resources/ResourcePages/resourcePagesConfigType.ts`

Change the `createAction` and `updateAction` requirement types from `ClinicalDataRepositoryService` to `ClinicalHub`:

```typescript
import type { ClinicalHub } from '../../../layers/ClinicalHub'

// In ResourcePagesConfig interface:
createAction: (formData: Schema.Schema.Type<TFormSchema>) => Effect.Effect<
  WithUrl<TResource>,
  ClinicalDataRepositoryErrors | NoSelectedOrgError,  // error types may also update
  ClinicalHub  // was ClinicalDataRepositoryService
>
updateAction: (url: ReadonlyUrl, current: TResource, formData: Schema.Schema.Type<TFormSchema>) => Effect.Effect<
  TResource,
  ClinicalDataRepositoryErrors | NoSelectedOrgError | NotFoundError<...>,
  ClinicalHub  // was ClinicalDataRepositoryService
>
```

**Remove:** Import of `ClinicalDataRepositoryService`. **Add:** Import of `ClinicalHub`.

---

## 2f: `apps/frontend/app/modules/resources/ResourcePages/EditResourcePage.tsx`

Two changes:

**1. Resource loading** — Replace `repositoryStream` + `StreamEither.mapEffect(repo.get)` + `useEitherStream` with `Effect.request(Get)` + `useEffectTs`:

```typescript
const { hub } = usePlatformContext()

const resourceEffect = useMemo(() => {
  if (Option.isNone(resourceUrl)) {
    return Effect.fail(new NotFoundError({ resourceType: config.resourceType, params: { url: rawResourceId } }))
  }
  const url = resourceUrl.value
  return Effect.gen(function* () {
    const origin = yield* hub.getOriginUrlForResource(url)
    return yield* Effect.request(
      EffectRequest.of<ResourceRequest.Get<TResource>>()({
        _tag: 'Get', domainType: config.resourceType, url, origin,
      }),
      hub.resolver
    )
  })
}, [hub, rawResourceId, resourceUrl])

const resourcePromise = useEffectTs(resourceEffect)
```

**2. Submit handler** — Change `Effect.provideService(ClinicalDataRepositoryService, clinicalDataRepositoryService)` to `Effect.provideService(ClinicalHub, hub)`.

---

## 2g: `apps/frontend/app/modules/resources/ResourcePages/makeCreateResourcePage.tsx`

Change `Effect.provideService(ClinicalDataRepositoryService, clinicalDataRepositoryService)` to `Effect.provideService(ClinicalHub, hub)`.

Change destructure from `clinicalDataRepositoryService` to `hub`.

---

## 2h: Update Tests

### `apps/frontend/app/modules/resources/ResourcePages/EditResourcePage.test.tsx`

Replace mock of `clinicalDataRepositoryService.repositoryStream` with a mock hub. Create a test hub using `Hub.makeHub<ResourceDataTypes>()` and register a mock origin with a test resolver that returns test data.

### `apps/frontend/app/modules/resources/ResourcePages/CreateResourcePage.test.tsx`

Same: replace `clinicalDataRepositoryService: {}` with a mock hub.

---

## Verification

```bash
npm run typecheck && npm run test
```

Collection pages (list views), pickers, create/edit pages should all typecheck. Existing tests pass with updated mocks.
