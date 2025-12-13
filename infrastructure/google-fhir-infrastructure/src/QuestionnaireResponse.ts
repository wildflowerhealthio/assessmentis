import { Layer } from 'effect'
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

  return Layer.succeed(QuestionnaireResponseRepository, {
    createQuestionnaireResponses: (
      questionnaireResponses: ReadonlyArray<typeof QuestionnaireResponse.Type>
    ) => repository.createWithBundle(questionnaireResponses),
    getQuestionnaireResponse: repository.get.bind(repository),
    getQuestionnaireResponses: repository.getMany.bind(repository),
    deleteQuestionnaireResponse: repository.delete.bind(repository),
    updateQuestionnaireResponse: repository.update.bind(repository),
  })
}
