import { Context } from 'effect'
import {
  QuestionnaireResponse,
  QuestionnaireResponseId,
} from '../resources/QuestionnaireResponse/QuestionnaireResponse'
import { BaseClinicalDataRepository } from '../../assessmentis/contexts/ClinicalDataRepository'

export class QuestionnaireResponseRepository extends Context.Tag(
  'QuestionnaireResponseRepository'
)<
  QuestionnaireResponseRepository,
  BaseClinicalDataRepository<QuestionnaireResponse, QuestionnaireResponseId>
>() {}
