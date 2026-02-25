import { Context } from 'effect'
import type { Questionnaire } from '../resources/Questionnaire/Questionnaire'
import type { ClinicalDataRepository } from '../types'

export class QuestionnaireRepository extends Context.Tag(
  'QuestionnaireRepository'
)<QuestionnaireRepository, ClinicalDataRepository<Questionnaire>>() {}
