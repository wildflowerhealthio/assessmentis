import { Location } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/location'
import '../traits/Labeled/implementations/location'
import '../traits/Link/implementations/location'
import '../traits/Listable/implementations/location'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function LocationIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Location} />
}
