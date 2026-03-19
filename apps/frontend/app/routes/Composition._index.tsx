import { Composition } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/composition'
import '../traits/Labeled/implementations/composition'
import '../traits/Link/implementations/composition'
import '../traits/Listable/implementations/composition'
/* eslint-enable import/no-unassigned-import */

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function CompositionIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Composition} />
}
