import { Practitioner } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/practitioner'
import '../traits/Labeled/implementations/practitioner'
import '../traits/Link/implementations/practitioner'
import '../traits/Listable/implementations/practitioner'
/* eslint-enable import/no-unassigned-import */

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function PractitionerIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Practitioner} />
}
