import { BaseClinicalDataRepository } from '@assessmentis/clinical-domain'
import { useCollection } from '@assessmentis/react-util'
import { pipe, Effect } from 'effect'
import { useRuntimeContext } from '../clientRuntime'
import { ReadonlyTag } from 'effect/Context'
import { ClientRuntimeContext } from '../../../../domain/platform-domain/src/PlatformService'

export function useClinicalDataCollection<
  Tid extends string,
  T extends { id?: Tid | undefined },
  Tag extends ClientRuntimeContext,
  Repo extends ReadonlyTag<Tag, BaseClinicalDataRepository<T, Tid>>,
>(repository: Repo, initial: ReadonlyArray<T>) {
  const clientRuntime = useRuntimeContext()

  return useCollection<Tid, T>(
    {
      apiDelete: async (id: Tid | undefined) => {
        if (!id) return
        const a = pipe(
          repository,
          Effect.flatMap((repo) => repo.delete(id))
        )
        return clientRuntime.runPromise(
          Effect.all([Effect.sleep('200 millis'), a])
        )
      },
      apiCreate: (t: T): Promise<T> => {
        return clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            repository.pipe(Effect.flatMap((repo) => repo.create(t))),
          ]).pipe(Effect.map(([, x]) => x))
        )
      },
    },
    initial
  )
}
