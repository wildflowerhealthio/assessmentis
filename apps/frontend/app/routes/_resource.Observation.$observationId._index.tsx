import { Effect, Option, Schema } from 'effect'
import {
  ObservationId,
  ObservationRepository,
} from '@assessmentis/clinical-domain/diagnostic-medicine'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/_resource.Observation.$observationId._index'
import { useResourceRunEffect } from '../clientRuntime'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import {
  getObservationDisplayName,
  formatObservationDetails,
} from '../modules/resources/Observation/utils/observationDisplay'
import { ObservationValue } from '../modules/resources/Observation/components/ObservationValue/ObservationValue'
import { ObservationInterpretation } from '../modules/resources/Observation/components/ObservationInterpretation/ObservationInterpretation'
import { ObservationComponents } from '../modules/resources/Observation/components/ObservationComponents/ObservationComponents'
import { ObservationAdditionalDetails } from '../modules/resources/Observation/components/ObservationAdditionalDetails/ObservationAdditionalDetails'
import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import { useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'

const tryDecodeObservationId = Schema.decodeOption(ObservationId)

export default function ObservationDetailPage({
  params,
}: Route.ComponentProps) {
  const observationLoader = useResourceRunEffect(
    useMemo(() => {
      const observationIdMaybe = tryDecodeObservationId(params.observationId)

      return Effect.gen(function* () {
        const repository = yield* ObservationRepository

        const observationId = yield* observationIdMaybe.pipe(
          Option.map(Effect.succeed),
          Option.getOrElse(() =>
            Effect.fail(
              new UnhandledError({ cause: 'Observation ID not found' })
            )
          )
        )

        return yield* repository.get(observationId)
      })
    }, [params.observationId])
  )

  useBreadcrumbs([
    { label: 'Observations', href: '/Observation' },
    {
      loading: observationLoader._tag === 'loading',
      label:
        observationLoader._tag === 'loaded'
          ? getObservationDisplayName(observationLoader.value)
          : 'Unknown Observation',
      href: `/Observation/${params.observationId}`,
    },
  ])

  if (observationLoader._tag == 'loading') {
    return (
      <ResourceDetailPage
        editTo={`/Observation/${params.observationId}/edit`}
        title={<Skeleton width={200} />}
        subtitle={
          <>
            Observation ID: <Skeleton width={100} />
          </>
        }
        sections={[
          {
            id: 'details',
            title: 'Details',
            content: (
              <DetailGrid
                items={{ skeleton: [<Skeleton />, <Skeleton />, <Skeleton />] }}
              />
            ),
          },
          {
            id: 'value',
            title: 'Value',
            content: <Skeleton count={3} />,
          },
        ]}
      />
    )
  }
  if (observationLoader._tag === 'error') {
    throw observationLoader.error
  }

  const observation = observationLoader.value
  const displayName = getObservationDisplayName(observation)

  return (
    <ResourceDetailPage
      editTo={`/Observation/${observation.id}/edit`}
      title={displayName}
      subtitle={`Observation ID: ${observation.id}`}
      sections={[
        {
          id: 'details',
          title: 'Details',
          content: <DetailGrid items={formatObservationDetails(observation)} />,
        },
        {
          id: 'value',
          title: 'Value',
          content: <ObservationValue observation={observation} />,
        },
        {
          id: 'interpretation',
          title: 'Interpretation & Reference Range',
          content: <ObservationInterpretation observation={observation} />,
          hidden:
            (!observation.interpretation ||
              observation.interpretation.length === 0) &&
            (!observation.referenceRange ||
              observation.referenceRange.length === 0),
        },
        {
          id: 'components',
          title: 'Components',
          content: <ObservationComponents observation={observation} />,
          hidden: !observation.component || observation.component.length === 0,
        },
        {
          id: 'additional',
          title: 'Additional Details',
          content: <ObservationAdditionalDetails observation={observation} />,
          hidden:
            !observation.method &&
            !observation.bodySite &&
            !observation.device &&
            !observation.specimen &&
            (!observation.note || observation.note.length === 0),
        },
      ]}
      debugData={observation}
    />
  )
}
