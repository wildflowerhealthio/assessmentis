import { Location } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/Location'
import '../traits/Labeled/implementations/Location'
import '../traits/Link/implementations/Location'
import '../traits/Listable/implementations/Location'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/ResourceListIndexPage'

export default function LocationIndexPage() {
  return <ResourceListIndexPage klass={Location} />
}
