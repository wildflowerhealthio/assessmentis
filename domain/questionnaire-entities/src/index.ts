import type { Questionnaire } from '@assessmentis/clinical-domain'

import * as gad7 from './gad7'
import * as diva2 from './diva2'
import * as noItems from './noItems'
export { gad7, diva2, noItems }

export const questionnaireTemplates: ReadonlyArray<Questionnaire> = [
  diva2.questionnaire,
  gad7.questionnaire,
  noItems.questionnaire,
]
