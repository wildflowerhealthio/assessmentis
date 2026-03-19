import { Suspense } from 'react'
import { Await } from 'react-router'

import { ResourceAwaitError } from '../modules/common/components/ResourceAwaitError/resource-await-error'

import { Observation } from '@assessmentis/clinical-domain'
import { useEitherStream } from '@assessmentis/react-util'

import Skeleton from 'react-loading-skeleton'

import '../traits/BreadcrumbLabel/implementations/observation'
import '../traits/Link/implementations/observation'

import { useResourceSubscription } from '../layers/use-resource-subscription'
import { useBreadcrumbs } from '../modules/Breadcrumbs/use-breadcrumbs'
import { DetailGrid } from '../modules/common/components/DetailGrid/detail-grid'
import { ResourceDetailPage } from '../modules/common/components/ResourceDetailPage/resource-detail-page'
import { ObservationAdditionalDetails } from '../modules/forms/Observation/ObservationAdditionalDetails/observation-additional-details'
import { ObservationComponents } from '../modules/forms/Observation/ObservationComponents/observation-components'
import { ObservationInterpretation } from '../modules/forms/Observation/ObservationInterpretation/observation-interpretation'
import { ObservationValue } from '../modules/forms/Observation/ObservationValue/observation-value'
import {
  formatObservationDetails,
  getObservationDisplayName,
} from '../modules/resources/Observation/utils/observation-display'
import { runEffectSyncFlat } from '../run-effect-sync'
import type { Route } from './+types/Observation.$url._index'

export default function ObservationDetailPage({ params }: Route.ComponentProps): React.JSX.Element {
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
          content: (
            <DetailGrid
              items={{
                skeleton: [<Skeleton key={0} />, <Skeleton key={1} />, <Skeleton key={2} />],
              }}
            />
          ),
          id: 'details',
          title: 'Details',
        },
        {
          content: <Skeleton count={3} />,
          id: 'value',
          title: 'Value',
        },
      ]}
    />
  )

  return (
    <Suspense fallback={loader}>
      <Await resolve={observationPromise} errorElement={<ResourceAwaitError />}>
        {(observation) => {
          const displayName = getObservationDisplayName(observation)
          const observationDetails = runEffectSyncFlat(formatObservationDetails(observation))

          return (
            <ResourceDetailPage
              editTo={`${observation.Link}/edit`}
              title={displayName}
              subtitle={`Observation: ${observation.url?.toString() ?? params.url}`}
              sections={[
                {
                  content: <DetailGrid items={observationDetails} />,
                  id: 'details',
                  title: 'Details',
                },
                {
                  content: <ObservationValue observation={observation} />,
                  id: 'value',
                  title: 'Value',
                },
                {
                  content: <ObservationInterpretation observation={observation} />,
                  hidden:
                    (!observation.interpretation || observation.interpretation.length === 0) &&
                    (!observation.referenceRange || observation.referenceRange.length === 0),
                  id: 'interpretation',
                  title: 'Interpretation & Reference Range',
                },
                {
                  content: <ObservationComponents observation={observation} />,
                  hidden: !observation.component || observation.component.length === 0,
                  id: 'components',
                  title: 'Components',
                },
                {
                  content: <ObservationAdditionalDetails observation={observation} />,
                  hidden:
                    !observation.method &&
                    !observation.bodySite &&
                    !observation.device &&
                    !observation.specimen &&
                    (!observation.note || observation.note.length === 0),
                  id: 'additional',
                  title: 'Additional Details',
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
