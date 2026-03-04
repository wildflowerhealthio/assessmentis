import { Either, Option, Schema, Stream } from 'effect'
import { Suspense, useMemo } from 'react'
import { Await } from 'react-router'

import { ReadonlyUrl } from '@assessmentis/effectful-store'
import { UnhandledError } from '@assessmentis/ontology'
import { useEitherStream } from '@assessmentis/react-util'
import { StreamEither } from '@assessmentis/util'

import { useBreadcrumbs } from 'app/modules/global/components/BreadcrumbProvider/useBreadcrumbs'
import Skeleton from 'react-loading-skeleton'

import { usePlatformContext } from '../layers/PlatformContext'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { ObservationAdditionalDetails } from '../modules/resources/Observation/components/ObservationAdditionalDetails/ObservationAdditionalDetails'
import { ObservationComponents } from '../modules/resources/Observation/components/ObservationComponents/ObservationComponents'
import { ObservationInterpretation } from '../modules/resources/Observation/components/ObservationInterpretation/ObservationInterpretation'
import { ObservationValue } from '../modules/resources/Observation/components/ObservationValue/ObservationValue'
import {
  formatObservationDetails,
  getObservationDisplayName,
} from '../modules/resources/Observation/utils/observationDisplay'
import { runEffectSyncFlat } from '../runEffectSync'
import type { Route } from './+types/Observation.$observationId._index'

const tryDecodeObservationUrl = Schema.decodeOption(ReadonlyUrl.FromString)

export default function ObservationDetailPage({
  params,
}: Route.ComponentProps) {
  const { clinicalDataRepositoryService } = usePlatformContext()

  const observationStream = useMemo(() => {
    const observationUrlMaybe = tryDecodeObservationUrl(params.observationId)

    return Option.match(observationUrlMaybe, {
      onSome: (observationUrl) =>
        clinicalDataRepositoryService.stream.Observation.pipe(
          StreamEither.mapEffect((repo) => repo.get(observationUrl))
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
              editTo={`/Observation/${observation.url?.toString() ?? params.observationId}/edit`}
              title={displayName}
              subtitle={`Observation: ${observation.url?.toString() ?? params.observationId}`}
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
