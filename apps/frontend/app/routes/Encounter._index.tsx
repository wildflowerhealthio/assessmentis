import { Encounter } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/encounter'
import '../traits/Labeled/implementations/encounter'
import '../traits/Link/implementations/encounter'
import '../traits/Listable/implementations/encounter'
/* eslint-enable import/no-unassigned-import */

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function EncounterIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Encounter} />
}
