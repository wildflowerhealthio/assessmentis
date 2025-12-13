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
  return Layer.succeed(
    QuestionnaireResponseRepository,
    new QuestionnaireResponseGoogleFhirRepository(config)
  )
}
