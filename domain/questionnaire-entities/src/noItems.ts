import type { Questionnaire } from '@assessmentis/clinical-domain/content-management'

const title = 'The Questionnaire With No Items'

export const questionnaire: Questionnaire = {
  resourceType: 'Questionnaire',
  title: title,
  name: 'noItems',
  status: 'draft',
  item: [],
}
