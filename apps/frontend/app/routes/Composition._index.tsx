import { Composition } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/Composition'
import '../traits/Labeled/implementations/Composition'
import '../traits/Link/implementations/Composition'
import '../traits/Listable/implementations/Composition'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/ResourceListIndexPage'

export default function CompositionIndexPage() {
  return <ResourceListIndexPage klass={Composition} />
}
