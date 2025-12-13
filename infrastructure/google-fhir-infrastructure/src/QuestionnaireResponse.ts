import {
  QuestionnaireResponse,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/questionnaires'
import { QuestionnaireResponseConfig } from '@assessmentis/config-domain/googleFhir'
import { createStandardRepository } from './BaseGoogleFhirRepository'

export const Repository = (config: QuestionnaireResponseConfig) =>
  createStandardRepository(
    QuestionnaireResponseRepository,
    'QuestionnaireResponse',
    QuestionnaireResponse,
    config,
    ({ getById, getAll, createWithBundle, deleteById, update }) => ({
      createQuestionnaireResponses: (
        questionnaireResponses: ReadonlyArray<typeof QuestionnaireResponse.Type>
      ) => createWithBundle(questionnaireResponses),
      getQuestionnaireResponse: getById,
      getQuestionnaireResponses: getAll,
      deleteQuestionnaireResponse: deleteById,
      updateQuestionnaireResponse: update,
    })
  )
