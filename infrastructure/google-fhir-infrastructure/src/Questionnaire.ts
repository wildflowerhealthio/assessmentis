import { Layer } from 'effect'
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

  return Layer.succeed(QuestionnaireRepository, {
    getQuestionnaire: repository.get.bind(repository),
    getQuestionnaires: repository.getMany.bind(repository),
    createQuestionnaire: repository.create.bind(repository),
    deleteQuestionnaire: repository.delete.bind(repository),
  })
}
