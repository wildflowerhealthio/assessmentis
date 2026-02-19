import { Questionnaire } from '@assessmentis/clinical-domain/content-management'
import type { Resource } from '@assessmentis/effectful-store'

const title = 'The Questionnaire With No Items'

export const questionnaire: Questionnaire = {
  [Resource.ResourceType]: typeof Questionnaire.ResourceSymbol,
  resourceType: 'Questionnaire',
  title: title,
  name: 'noItems',
  status: 'draft',
  item: [],
}
