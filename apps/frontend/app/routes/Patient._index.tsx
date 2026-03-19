import { Patient } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/patient'
import '../traits/Labeled/implementations/patient'
import '../traits/Link/implementations/patient'
import '../traits/Listable/implementations/patient'
/* eslint-enable import/no-unassigned-import */

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function PatientIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Patient} />
}
