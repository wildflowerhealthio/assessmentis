import { Observation } from '@assessmentis/clinical-domain'

import { ObservationFiltersBridge } from '../modules/resources/Observation/components/observation-filters-bridge'

import '../traits/BreadcrumbLabel/implementations/observation'
import '../traits/Labeled/implementations/observation'
import '../traits/Link/implementations/observation'
import '../traits/Listable/implementations/observation'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function ObservationIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Observation} FilterComponent={ObservationFiltersBridge} />
}
