import { Layer, Effect } from 'effect'
import {
  QuestionnaireResponse,
  QuestionnaireResponseRepository,
} from '@assessmentis/clinical-domain/questionnaires'
import { QuestionnaireResponseConfig } from '@assessmentis/config-domain/googleFhir'
import * as Base from './Base'

export const Repository = (config: QuestionnaireResponseConfig) =>
  Layer.effect(
    QuestionnaireResponseRepository,
    Effect.gen(function* () {
      const { getAll, getById, createWithBundle, deleteById, update } =
        yield* Base.BaseGoogleFhirStoreClient
      const createQuestionnaireResponses: typeof QuestionnaireResponseRepository.Service.createQuestionnaireResponses =
        (questionnaireResponses) =>
          createWithBundle(QuestionnaireResponse)(questionnaireResponses)

      const getQuestionnaireResponse: typeof QuestionnaireResponseRepository.Service.getQuestionnaireResponse =
        getById('QuestionnaireResponse', QuestionnaireResponse)

      const getQuestionnaireResponses: typeof QuestionnaireResponseRepository.Service.getQuestionnaireResponses =
        getAll('QuestionnaireResponse', QuestionnaireResponse)

      const deleteQuestionnaireResponse: typeof QuestionnaireResponseRepository.Service.deleteQuestionnaireResponse =
        deleteById('QuestionnaireResponse', QuestionnaireResponse)

      const updateQuestionnaireResponse: typeof QuestionnaireResponseRepository.Service.updateQuestionnaireResponse =
        update('QuestionnaireResponse', QuestionnaireResponse)

      return {
        createQuestionnaireResponses,
        deleteQuestionnaireResponse,
        getQuestionnaireResponses,
        getQuestionnaireResponse,
        updateQuestionnaireResponse,
      }
    })
  ).pipe(Layer.provide(Base.LiveClient(config)))
