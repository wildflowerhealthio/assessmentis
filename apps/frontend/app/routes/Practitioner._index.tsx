import { Practitioner } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/practitioner'
import '../traits/Labeled/implementations/practitioner'
import '../traits/Link/implementations/practitioner'
import '../traits/Listable/implementations/practitioner'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function PractitionerIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Practitioner} />
}
