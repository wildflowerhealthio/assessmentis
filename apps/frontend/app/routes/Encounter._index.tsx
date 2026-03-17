import { Encounter } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/Encounter'
import '../traits/Labeled/implementations/Encounter'
import '../traits/Link/implementations/Encounter'
import '../traits/Listable/implementations/Encounter'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/ResourceListIndexPage'

export default function EncounterIndexPage() {
  return <ResourceListIndexPage klass={Encounter} />
}
