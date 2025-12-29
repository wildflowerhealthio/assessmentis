import { Effect, Option, Schema } from 'effect'
import {
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Composition.$compositionId._index'
import { getRuntime } from '../clientRuntime'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import {
  getCompositionDisplayName,
  formatCompositionDetails,
} from '../modules/resources/Composition/utils/compositionDisplay'
import { CompositionSections } from '../modules/resources/Composition/components/CompositionSections/CompositionSections'

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
  const displayName = getCompositionDisplayName(composition)

  return (
    <ResourceDetailPage
      backTo="/Composition"
      backLabel="← Back to Compositions"
      editTo={`/Composition/${composition.id}/edit`}
      title={displayName}
      subtitle={`Composition ID: ${composition.id}`}
      sections={[
        {
          id: 'details',
          title: 'Details',
          content: <DetailGrid items={formatCompositionDetails(composition)} />,
        },
        {
          id: 'sections',
          title: 'Sections',
          content: <CompositionSections composition={composition} />,
          hidden: !composition.section || composition.section.length === 0,
        },
      ]}
      debugData={composition}
    />
  )
}
