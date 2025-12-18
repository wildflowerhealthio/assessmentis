import { Layer } from 'effect'
import {
  Questionnaire,
  QuestionnaireRepository,
  QuestionnaireId,
} from '@assessmentis/clinical-domain/content-management'
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
  return Layer.succeed(
    QuestionnaireRepository,
    new QuestionnaireGoogleFhirRepository(config)
  )
}
