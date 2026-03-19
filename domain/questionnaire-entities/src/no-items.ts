import { Questionnaire } from '@assessmentis/clinical-domain'

const title = 'The Questionnaire With No Items'

export const questionnaire: Questionnaire = Questionnaire.make({
  domainType: 'Questionnaire',
  item: [],
  name: 'noItems',
  status: 'draft',
  title: title,
})
