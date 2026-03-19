import { Location } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/location'
import '../traits/Labeled/implementations/location'
import '../traits/Link/implementations/location'
import '../traits/Listable/implementations/location'
/* eslint-enable import/no-unassigned-import */

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function LocationIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Location} />
}
