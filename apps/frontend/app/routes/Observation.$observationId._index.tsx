import { Either, Option, Schema, Stream } from 'effect'
import { StreamEither } from '@assessmentis/util'
import { ObservationId } from '@assessmentis/clinical-domain/diagnostic-medicine'
import { UnhandledError } from '@assessmentis/ontology'
import type { Route } from './+types/Observation.$observationId._index'
import { runEffectSyncFlat } from '../runEffectSync'
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
import { Suspense, useMemo } from 'react'
import Skeleton from 'react-loading-skeleton'
import { useEitherStream } from '@assessmentis/react-util'
import { usePlatformContext } from '../layers/PlatformContext'
import { Await } from 'react-router'

const tryDecodeObservationId = Schema.decodeOption(ObservationId)

export default function ObservationDetailPage({
  params,
}: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const observationStream = useMemo(() => {
    const observationIdMaybe = tryDecodeObservationId(params.observationId)

    return Option.match(observationIdMaybe, {
      onSome: (observationId) =>
        clinicalDataRepositoryService.stream.Observation.pipe(
          StreamEither.mapEffect((repo) => repo.get(observationId))
        ),
      onNone: () =>
        Stream.succeed(
          Either.left(
            new UnhandledError({ message: 'Observation ID not found' })
          )
        ),
    })
  }, [clinicalDataRepositoryService, params.observationId])

  const observationPromise = useEitherStream(observationStream)

  const breadcrumbs = useMemo(
    () => [
      { label: 'Observations', href: '/Observation' },
      observationPromise.then((o) => ({
        label: getObservationDisplayName(o),
        href: `/Observation/${params.observationId}`,
      })),
    ],
    [observationPromise, params.observationId]
  )

  useBreadcrumbs(breadcrumbs)

  const loader = (
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

  return (
    <Suspense fallback={loader}>
      <Await resolve={observationPromise}>
        {(observation) => {
          const displayName = getObservationDisplayName(observation)
          const observationDetails = runEffectSyncFlat(
            formatObservationDetails(observation)
          )

          return (
            <ResourceDetailPage
              editTo={`/Observation/${observation.id}/edit`}
              title={displayName}
              subtitle={`Observation ID: ${observation.id}`}
              sections={[
                {
                  id: 'details',
                  title: 'Details',
                  content: <DetailGrid items={observationDetails} />,
                },
                {
                  id: 'value',
                  title: 'Value',
                  content: <ObservationValue observation={observation} />,
                },
                {
                  id: 'interpretation',
                  title: 'Interpretation & Reference Range',
                  content: (
                    <ObservationInterpretation observation={observation} />
                  ),
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
                  hidden:
                    !observation.component ||
                    observation.component.length === 0,
                },
                {
                  id: 'additional',
                  title: 'Additional Details',
                  content: (
                    <ObservationAdditionalDetails observation={observation} />
                  ),
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
        }}
      </Await>
    </Suspense>
  )
}
