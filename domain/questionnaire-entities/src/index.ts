import type { Questionnaire } from '@assessmentis/clinical-domain'

import * as diva2 from './diva2'
import * as gad7 from './gad7'
import * as noItems from './no-items'

export { gad7, diva2, noItems }

export const questionnaireTemplates: readonly Questionnaire[] = [
  diva2.questionnaire,
  gad7.questionnaire,
  noItems.questionnaire,
]
