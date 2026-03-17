import { Suspense } from 'react'
import { Await } from 'react-router'

import { Observation } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import Skeleton from 'react-loading-skeleton'

import 'app/traits/BreadcrumbLabel/implementations/Observation'
import 'app/traits/Link/implementations/Observation'

import { useResourceSubscription } from '../layers/useResourceSubscription'
import { useBreadcrumbs } from '../modules/Breadcrumbs/useBreadcrumbs'
import { DetailGrid } from '../modules/common/components/DetailGrid/DetailGrid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/ResourceDetailPage'
import { ObservationAdditionalDetails } from '../modules/forms/Observation/ObservationAdditionalDetails/ObservationAdditionalDetails'
import { ObservationComponents } from '../modules/forms/Observation/ObservationComponents/ObservationComponents'
import { ObservationInterpretation } from '../modules/forms/Observation/ObservationInterpretation/ObservationInterpretation'
import { ObservationValue } from '../modules/forms/Observation/ObservationValue/ObservationValue'
import {
  formatObservationDetails,
  getObservationDisplayName,
} from '../modules/resources/Observation/utils/observationDisplay'
import { runEffectSyncFlat } from '../runEffectSync'
import type { Route } from './+types/Observation.$url._index'

export default function ObservationDetailPage({
  params,
}: Route.ComponentProps) {
  const observationStream = useResourceSubscription(Observation, params.url)

  const observationPromise = useEitherStream(observationStream)

  useBreadcrumbs(() => [Observation, observationPromise], [observationPromise])

  const loader = (
    <ResourceDetailPage
      editTo={`/Observation/${encodeURIComponent(params.url)}/edit`}
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
              editTo={`${observation.Link}/edit`}
              title={displayName}
              subtitle={`Observation: ${observation.url?.toString() ?? params.url}`}
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
