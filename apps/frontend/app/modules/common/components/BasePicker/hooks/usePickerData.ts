import { Effect } from 'effect'
import { useState, useMemo } from 'react'
import { useResourceRunEffect } from 'app/clientRuntime'
import { PickerItem } from '../types/PickerTypes'
import { BaseClinicalDataRepository } from '@assessmentis/clinical-domain'
import { ClientRuntimeContext } from '../../../../../../../../domain/platform-domain/src/PlatformService'
import { LoadedResult } from '@assessmentis/ontology'

export interface UsePickerDataOptions<
  T extends { id?: string | undefined },
  TRepo extends BaseClinicalDataRepository<T, string>,
  O,
> {
  repository: Effect.Effect<TRepo, never, ClientRuntimeContext>
  transform: (item: T) => PickerItem<O>
  enabled?: boolean
}

interface UsePickerDataResult<O> {
  items: PickerItem<O>[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function usePickerData<
  T extends { id?: string | undefined },
  TRepo extends BaseClinicalDataRepository<T, string>,
  O,
>(options: UsePickerDataOptions<T, TRepo, O>): UsePickerDataResult<O> {
  const { repository, transform, enabled = true } = options

  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const items = useResourceRunEffect(
    useMemo(
      () =>
        Effect.gen(function* () {
          const _ = refetchTrigger
          if (!enabled) return yield* Effect.fail({ _tag: 'Disabled' } as const)

          const repo = yield* repository
          const resources = yield* repo.getMany()
          return resources.map(transform)
        }),
      [repository, transform, refetchTrigger, enabled]
    )
  )

  const refetch = () => setRefetchTrigger((prev) => prev + 1)

  return LoadedResult.handle(items, {
    onLoading: (): UsePickerDataResult<O> => ({
      items: [],
      loading: true,
      error: null,
      refetch,
    }),
    onError: (error): UsePickerDataResult<O> => ({
      items: [],
      loading: false,
      error: new Error(error == null ? 'Unknown error' : String(error)),
      refetch,
    }),
    onSuccess: (loadedItems): UsePickerDataResult<O> => ({
      items: loadedItems,
      loading: false,
      error: null,
      refetch,
    }),
  })
}
