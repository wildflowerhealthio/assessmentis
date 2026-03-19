import { Composition } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/composition'
import '../traits/Labeled/implementations/composition'
import '../traits/Link/implementations/composition'
import '../traits/Listable/implementations/composition'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function CompositionIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={Composition} />
}
