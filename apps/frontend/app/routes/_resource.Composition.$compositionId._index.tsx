import { Effect, Option, Schema } from 'effect'
import {
  CompositionId,
  CompositionRepository,
} from '@assessmentis/clinical-domain/content-management'
import { LoadedResult, UnhandledError } from '@assessmentis/ontology'
import { gad7Report } from '@assessmentis/document-template-kinds'
import { base } from '@assessmentis/document-template-instances'
import type { Route } from './+types/_resource.Composition.$compositionId._index'
import { getRuntime, useResourceRunEffect } from '../clientRuntime'
import { useMemo } from 'react'
import { Link } from 'react-router'

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
  const reportLoader = useResourceRunEffect(
    useMemo(() => gad7Report(base, composition.subject), [composition.subject])
  )

  return (
    <div
      style={{ overflowY: 'scroll', height: '100%', padding: 'var(--space-6)' }}
    >
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <Link to="/Composition" className="button-3 ghost">
          ← Back to Compositions
        </Link>
        <Link
          to={`/Composition/${composition.id}/edit`}
          className="button-2 blue"
        >
          Edit
        </Link>
      </div>
      <h2 className="heading-3">{composition.title ?? composition.id}</h2>
      <div className="subheading-3">
        {composition.status ?? 'status unknown'}
        {composition.date ? ` • ${composition.date}` : ''}
      </div>
      <pre>{JSON.stringify(composition, null, 2)}</pre>
      {LoadedResult.handle(reportLoader, {
        onLoading: () => <div>Loading report...</div>,
        onError: (e) => <div>Error loading report: {String(e)}</div>,
        onSuccess: (report) => <div>{report}</div>,
      })}
    </div>
  )
}
