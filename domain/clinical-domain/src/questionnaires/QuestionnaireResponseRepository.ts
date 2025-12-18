import { Context } from 'effect'
import {
  QuestionnaireResponse,
  QuestionnaireResponseId,
} from '../content-management/resources/QuestionnaireResponse'
import { BaseClinicalDataRepository } from '../general-purpose'
export class QuestionnaireResponseRepository extends Context.Tag(
  'QuestionnaireResponseRepository'
)<
  QuestionnaireResponseRepository,
  BaseClinicalDataRepository<QuestionnaireResponse, QuestionnaireResponseId>
>() {}
