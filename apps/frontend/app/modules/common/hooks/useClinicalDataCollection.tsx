import { BaseClinicalDataRepository } from '@assessmentis/clinical-domain'
import { useCollection } from '@assessmentis/react-util'
import { pipe, Effect } from 'effect'
import { useLoadedRuntimeContext } from '../../../clientRuntime'
import { ReadonlyTag } from 'effect/Context'
import { ClientRuntimeContext } from '@assessmentis/platform-domain'
import { LoadedResult } from '@assessmentis/ontology'
import { useMemo } from 'react'

const useLoadedValueOrDefault = <T, O>(
  loaded: LoadedResult<T, unknown>,
  defaultValue: O,
  transform: (value: T) => O
): O => {
  return LoadedResult.handle(loaded, {
    onLoading: () => defaultValue,
    onError: () => defaultValue,
    onSuccess: (value) => transform(value),
  })
}

export function useClinicalDataCollection<
  Tid extends string,
  T extends { id?: Tid | undefined },
  Tag extends ClientRuntimeContext,
  Repo extends ReadonlyTag<Tag, BaseClinicalDataRepository<T, Tid>>,
  E,
>(repository: Repo, loader: LoadedResult<ReadonlyArray<T>, E>) {
  const clientRuntime = useLoadedRuntimeContext()

  const cantRunActions = {
    apiDelete: (_: Tid | undefined) => Promise.reject("Can't run actions"),
    apiCreate: (_: T) => Promise.reject("Can't run actions"),
  }

  const actions = useLoadedValueOrDefault(
    clientRuntime,
    cantRunActions,
    (runtime) => ({
      apiDelete: async (id: Tid | undefined) => {
        if (!id) return
        const a = pipe(
          repository,
          Effect.flatMap((repo) => repo.delete(id))
        )
        return runtime.runPromise(Effect.all([Effect.sleep('200 millis'), a]))
      },
      apiCreate: (t: T): Promise<T> => {
        return runtime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            repository.pipe(Effect.flatMap((repo) => repo.create(t))),
          ]).pipe(Effect.map(([, x]) => x))
        )
      },
    })
  )

  const initial = useMemo(
    () => (loader._tag == 'loaded' ? loader.value : []),
    [loader]
  )

  const { collection, createItem, deleteItem } = useCollection<Tid, T>(
    actions,
    initial
  )

  if (loader._tag == 'loaded') {
    return {
      collection: LoadedResult.loaded(collection),
      createItem,
      deleteItem,
    }
  }

  return { collection: loader, createItem, deleteItem }
}
