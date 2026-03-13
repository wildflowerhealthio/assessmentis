import { Patient } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/Patient'
import '../traits/Labeled/implementations/Patient'
import '../traits/Link/implementations/Patient'
import '../traits/Listable/implementations/Patient'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/ResourceListIndexPage'

export default function PatientIndexPage() {
  return <ResourceListIndexPage klass={Patient} />
}
