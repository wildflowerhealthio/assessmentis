import { Observation } from '@assessmentis/clinical-domain'

import { ObservationFiltersBridge } from '../modules/resources/Observation/components/observation-filters-bridge'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/observation'
import '../traits/Labeled/implementations/observation'
import '../traits/Link/implementations/observation'
import '../traits/Listable/implementations/observation'
/* eslint-enable import/no-unassigned-import */

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function ObservationIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Observation} FilterComponent={ObservationFiltersBridge} />
}
