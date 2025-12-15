import { Context } from 'effect'
import { Questionnaire, QuestionnaireId } from './models/Questionnaire'
import { BaseClinicalDataRepository } from '../general-purpose'

export class QuestionnaireRepository extends Context.Tag(
  'QuestionnaireRepository'
)<
  QuestionnaireRepository,
  BaseClinicalDataRepository<Questionnaire, QuestionnaireId>
>() {}
