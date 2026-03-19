import { QuestionnaireResponse } from '@assessmentis/clinical-domain'

import '../traits/BreadcrumbLabel/implementations/questionnaire-response'
import '../traits/Labeled/implementations/questionnaire-response'
import '../traits/Link/implementations/questionnaire-response'
import '../traits/Listable/implementations/questionnaire-response'

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function QuestionnaireResponseIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={QuestionnaireResponse} />
}
