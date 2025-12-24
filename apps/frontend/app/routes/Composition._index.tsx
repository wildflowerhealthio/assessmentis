import { DateTime, Effect } from 'effect'
import {
  Composition,
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import { useRuntimeContext } from 'app/clientRuntime'
import { useCollection } from '@assessmentis/react-util'
import type { Route } from './+types/Composition._index'
import CompositionList from '../modules/compositions/components/CompositionList'
import { getRuntime } from '../clientRuntime'

export async function clientLoader(_: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()

  const compositions = await runtime.runPromise(
    Effect.gen(function* () {
      const compositionRepository = yield* CompositionRepository
      return yield* compositionRepository.getMany()
    })
  )

  return { compositions }
}

const useCompositions = (initial: Composition[]) => {
  const clientRuntime = useRuntimeContext()

  return useCollection<CompositionId, Composition>(
    {
      apiDelete: async (id: CompositionId) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            CompositionRepository.pipe(Effect.flatMap((cr) => cr.delete(id))),
          ])
        ),
      apiCreate: async (c_: Composition) =>
        clientRuntime.runPromise(
          Effect.all([
            Effect.sleep('200 millis'),
            CompositionRepository.pipe(Effect.flatMap((cr) => cr.create(c_))),
          ]).pipe(Effect.map(([, x]) => x))
        ),
    },
    initial
  )
}

export default function CompositionPage({ loaderData }: Route.ComponentProps) {
  const {
    collection: compositions,
    deleteItem: deleteComposition,
    createItem: createComposition,
  } = useCompositions(loaderData.compositions)

  return (
    <>
      <h2 className="heading-3">Compositions</h2>
      <button
        className="element-button button-1 primary"
        onClick={() => {
          createComposition({
            resourceType: 'Composition',
            title: 'New Composition',
            status: 'preliminary',
            type: { coding: [] },
            subject: {},
            author: [{ display: 'Anonymous' }],
            date: Effect.runSync(DateTime.now),
            section: [],
          })
        }}
        style={{ marginBottom: 'var(--space-4)' }}
      >
        + New Composition
      </button>
      <CompositionList
        compositions={compositions}
        deleteComposition={deleteComposition}
      />
    </>
  )
}
