import { Context } from 'effect'
import {
  Questionnaire,
  QuestionnaireId,
} from '../resources/Questionnaire/Questionnaire'
import { BaseClinicalDataRepository } from '../../assessmentis/contexts/ClinicalDataRepository'

export class QuestionnaireRepository extends Context.Tag(
  'QuestionnaireRepository'
)<
  QuestionnaireRepository,
  BaseClinicalDataRepository<Questionnaire, QuestionnaireId>
>() {}
