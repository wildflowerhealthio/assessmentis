import {
  Questionnaire,
  QuestionnaireRepository,
  QuestionnaireId,
} from '@assessmentis/clinical-domain/questionnaires'
import { QuestionnaireConfig } from '@assessmentis/config-domain/googleFhir'
import { BaseGoogleFhirRepository } from './BaseGoogleFhirRepository'

class QuestionnaireGoogleFhirRepository extends BaseGoogleFhirRepository<
  typeof Questionnaire.Type,
  typeof Questionnaire.Encoded,
  QuestionnaireId
> {
  constructor(config: QuestionnaireConfig) {
    super('Questionnaire', Questionnaire, config)
  }
}

export const Repository = (config: QuestionnaireConfig) => {
  const repository = new QuestionnaireGoogleFhirRepository(config)

  return repository.createLayer(
    QuestionnaireRepository,
    ({ getById, getAll, create, deleteById }) => ({
      getQuestionnaire: getById,
      getQuestionnaires: getAll,
      createQuestionnaire: create,
      deleteQuestionnaire: deleteById,
    })
  )
}
