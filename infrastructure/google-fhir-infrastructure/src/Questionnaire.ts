import {
  Questionnaire,
  QuestionnaireRepository,
} from '@assessmentis/clinical-domain/questionnaires'
import { QuestionnaireConfig } from '@assessmentis/config-domain/googleFhir'
import { createStandardRepository } from './BaseGoogleFhirRepository'

export const Repository = (config: QuestionnaireConfig) =>
  createStandardRepository(
    QuestionnaireRepository,
    'Questionnaire',
    Questionnaire,
    config,
    ({ getById, getAll, create, deleteById }) => ({
      getQuestionnaire: getById,
      getQuestionnaires: getAll,
      createQuestionnaire: create,
      deleteQuestionnaire: deleteById,
    })
  )
