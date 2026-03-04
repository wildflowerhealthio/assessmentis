import { Context } from 'effect'

import type { QuestionnaireResponse } from '../resources/QuestionnaireResponse/QuestionnaireResponse'
import type { ClinicalDataRepository } from '../types'

export class QuestionnaireResponseRepository extends Context.Tag(
  'QuestionnaireResponseRepository'
)<
  QuestionnaireResponseRepository,
  ClinicalDataRepository<QuestionnaireResponse>
>() {}
