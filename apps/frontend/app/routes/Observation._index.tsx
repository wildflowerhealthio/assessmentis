import { Observation } from '@assessmentis/clinical-domain'

import { ObservationFiltersBridge } from '../modules/resources/Observation/components/ObservationFiltersBridge'

import '../traits/BreadcrumbLabel/implementations/Observation'
import '../traits/Labeled/implementations/Observation'
import '../traits/Link/implementations/Observation'
import '../traits/Listable/implementations/Observation'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/ResourceListIndexPage'

export default function ObservationIndexPage() {
  return (
    <ResourceListIndexPage
      klass={Observation}
      FilterComponent={ObservationFiltersBridge}
    />
  )
}
