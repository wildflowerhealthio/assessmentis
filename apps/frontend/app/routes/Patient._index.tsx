import { Patient } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/patient'
import '../traits/Labeled/implementations/patient'
import '../traits/Link/implementations/patient'
import '../traits/Listable/implementations/patient'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function PatientIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Patient} />
}
