import { QuestionnaireResponse } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/QuestionnaireResponse'
import '../traits/Labeled/implementations/QuestionnaireResponse'
import '../traits/Link/implementations/QuestionnaireResponse'
import '../traits/Listable/implementations/QuestionnaireResponse'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/ResourceListIndexPage'

export default function QuestionnaireResponseIndexPage() {
  return <ResourceListIndexPage klass={QuestionnaireResponse} />
}
