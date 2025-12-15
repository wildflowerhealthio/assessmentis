import { Context } from 'effect'
import {
  QuestionnaireResponse,
  QuestionnaireResponseId,
} from './models/QuestionnaireResponse'
import { BaseClinicalDataRepository } from '../general-purpose'
export class QuestionnaireResponseRepository extends Context.Tag(
  'QuestionnaireResponseRepository'
)<
  QuestionnaireResponseRepository,
  BaseClinicalDataRepository<QuestionnaireResponse, QuestionnaireResponseId>
>() {}
