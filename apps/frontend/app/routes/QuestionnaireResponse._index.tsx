import { QuestionnaireResponse } from '@assessmentis/clinical-domain'

/* eslint-disable import/no-unassigned-import -- Side-effect imports that register trait implementations for this route's resource type */
import '../traits/BreadcrumbLabel/implementations/questionnaire-response'
import '../traits/Labeled/implementations/questionnaire-response'
import '../traits/Link/implementations/questionnaire-response'
import '../traits/Listable/implementations/questionnaire-response'
/* eslint-enable import/no-unassigned-import */

import { ResourceListIndexPage } from '../modules/ResourceListIndexPage/resource-list-index-page'

export default function QuestionnaireResponseIndexPage(): React.JSX.Element {
  return <ResourceListIndexPage klass={QuestionnaireResponse} />
}
