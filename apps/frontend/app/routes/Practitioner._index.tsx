import { Practitioner } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/Practitioner'
import '../traits/Labeled/implementations/Practitioner'
import '../traits/Link/implementations/Practitioner'
import '../traits/Listable/implementations/Practitioner'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/ResourceListIndexPage'

export default function PractitionerIndexPage() {
  return <ResourceListIndexPage klass={Practitioner} />
}
