import { Context } from 'effect'
import { QuestionnaireResponse } from '../resources/QuestionnaireResponse/QuestionnaireResponse'
import { ClinicalDataRepository } from '../../types'

export class QuestionnaireResponseRepository extends Context.Tag(
  'QuestionnaireResponseRepository'
)<
  QuestionnaireResponseRepository,
  ClinicalDataRepository<QuestionnaireResponse>
>() {}
