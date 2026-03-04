import { Effect, Schema } from 'effect'

import type {
  ClinicalDataRepository,
  Schemas,
} from '@assessmentis/clinical-domain'
import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { useCollection, useCollectionPromise } from '@assessmentis/react-util'

type AnyResource = Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>

const decodeUrl = Schema.decodeSync(ReadonlyUrl.FromString)

const urlKeyOf = <T extends { url?: ReadonlyUrl | undefined }>(
  item: T
): string | undefined => item.url?.toString()

const actions = <
  T extends AnyResource & {
    url?: ReadonlyUrl | undefined
    domainType: string
  },
  E,
>(
  repoEffect: Effect.Effect<ClinicalDataRepository<T>, E, never>
) => ({
  apiDelete: async (urlKey: string) => {
    const url = decodeUrl(urlKey)
    return Effect.runPromise(
      Effect.all([
        Effect.sleep('200 millis'),
        Effect.flatMap(repoEffect, (repo) => repo.delete(url)),
      ])
    )
  },
  apiCreate: (t: T): Promise<T> => {
    return Effect.runPromise(
      Effect.all([
        Effect.sleep('200 millis'),
        Effect.flatMap(repoEffect, (repo) => repo.create(t)),
      ]).pipe(Effect.map(([, x]) => x))
    )
  },
})

export function useClinicalDataCollection<
  T extends AnyResource & {
    url?: ReadonlyUrl | undefined
    domainType: string
  },
  E,
>(
  repoEffect: Effect.Effect<ClinicalDataRepository<T>, E, never>,
  data: ReadonlyArray<T>
) {
  return useCollection<T>(actions(repoEffect), data, urlKeyOf)
}

export function useClinicalDataCollectionPromise<
  T extends AnyResource & {
    url?: ReadonlyUrl | undefined
    domainType: string
  },
  E,
>(
  repoEffect: Effect.Effect<ClinicalDataRepository<T>, E, never>,
  dataPromise: Promise<ReadonlyArray<T>>
) {
  return useCollectionPromise<T>(actions(repoEffect), dataPromise, urlKeyOf)
}
