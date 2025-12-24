import { Effect, Option, Schema } from 'effect'
import {
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Composition.$compositionId'
import { getRuntime } from '../clientRuntime'

const tryDecodeCompositionId = Schema.decodeOption(CompositionId)

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const runtime = await getRuntime()
  const compositionIdMaybe = tryDecodeCompositionId(params.compositionId)

  const composition = await runtime.runPromise(
    Effect.gen(function* () {
      const repository = yield* CompositionRepository

      const compositionId = yield* compositionIdMaybe.pipe(
        Option.map(Effect.succeed),
        Option.getOrElse(() =>
          Effect.fail(new UnhandledError({ cause: 'Composition not found' }))
        )
      )

      return yield* repository.get(compositionId)
    })
  )

  return { composition }
}

export default function CompositionDetailsPage({
  loaderData,
}: Route.ComponentProps) {
  const { composition } = loaderData

  return (
    <div>
      <h2 className="heading-3">{composition.title ?? composition.id}</h2>
      <div className="subheading-3">
        {composition.status ?? 'status unknown'}
        {composition.date ? ` • ${composition.date}` : ''}
      </div>
      <pre>{JSON.stringify(composition, null, 2)}</pre>
    </div>
  )
}
