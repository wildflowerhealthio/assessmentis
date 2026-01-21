import { Context } from 'effect'
import { Questionnaire } from '../resources/Questionnaire/Questionnaire'
import { ClinicalDataRepository } from '../../types'

export class QuestionnaireRepository extends Context.Tag(
  'QuestionnaireRepository'
)<QuestionnaireRepository, ClinicalDataRepository<Questionnaire>>() {}
