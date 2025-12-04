import { Layer, Effect } from 'effect'
import {
  QuestionnaireResponse,
  QuestionnaireResponseRepository,
} from '@assessmentis/domain/questionnaires'
import { FhirClient, LiveFhirClient } from '../FhirLiveLayer'

export const FhirQuestionnaireResponseRepository = Layer.effect(
  QuestionnaireResponseRepository,
  Effect.gen(function* () {
    const { getAll, getById, createWithBundle, deleteById, update } =
      yield* FhirClient

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
).pipe(Layer.provide(LiveFhirClient))
