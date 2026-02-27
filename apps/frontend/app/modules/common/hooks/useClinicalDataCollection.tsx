import type {
  ClinicalDataRepository,
  Schemas,
} from '@assessmentis/clinical-domain'
import { useCollection, useCollectionPromise } from '@assessmentis/react-util'
import type { Schema } from 'effect'
import { Effect } from 'effect'
import type { ReadonlyUrl } from '@assessmentis/effectful-store'

type AnyResource = Schema.Schema.Type<(typeof Schemas)[keyof typeof Schemas]>

const actions = <
  T extends AnyResource & {
    url?: ReadonlyUrl | undefined
    domainType: string
  },
  E,
>(
  repoEffect: Effect.Effect<ClinicalDataRepository<T>, E, never>
) => ({
  apiDelete: async (url: T['url']) => {
    if (!url) return

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
  return useCollection<T>(actions(repoEffect), data)
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
  return useCollectionPromise<T>(actions(repoEffect), dataPromise)
}
