import { Encounter } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/encounter'
import '../traits/Labeled/implementations/encounter'
import '../traits/Link/implementations/encounter'
import '../traits/Listable/implementations/encounter'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function EncounterIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Encounter} />
}
