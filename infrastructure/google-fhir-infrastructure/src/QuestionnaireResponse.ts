import {
  QuestionnaireResponse,
  QuestionnaireResponseRepository,
  QuestionnaireResponseId,
} from '@assessmentis/clinical-domain/questionnaires'
import { QuestionnaireResponseConfig } from '@assessmentis/config-domain/googleFhir'
import { BaseGoogleFhirRepository } from './BaseGoogleFhirRepository'

class QuestionnaireResponseGoogleFhirRepository extends BaseGoogleFhirRepository<
  typeof QuestionnaireResponse.Type,
  typeof QuestionnaireResponse.Encoded,
  QuestionnaireResponseId
> {
  constructor(config: QuestionnaireResponseConfig) {
    super('QuestionnaireResponse', QuestionnaireResponse, config)
  }
}

export const Repository = (config: QuestionnaireResponseConfig) => {
  const repository = new QuestionnaireResponseGoogleFhirRepository(config)

  return repository.createLayer(
    QuestionnaireResponseRepository,
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
}
