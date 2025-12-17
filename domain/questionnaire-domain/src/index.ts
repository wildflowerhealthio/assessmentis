import { Questionnaire } from '@assessmentis/clinical-domain'

import { questionnaire as gad7 } from './gad7'
import { questionnaire as diva2 } from './diva2'
import { questionnaire as noItems } from './noItems'
export { gad7, diva2, noItems }

export const questionnaireTemplates: ReadonlyArray<Questionnaire> = [
  diva2,
  gad7,
  noItems,
]
