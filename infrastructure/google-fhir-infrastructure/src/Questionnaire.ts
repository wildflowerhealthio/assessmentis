import { Layer, Effect } from 'effect'
import {
  Questionnaire,
  QuestionnaireRepository,
} from '@assessmentis/clinical-domain/questionnaires'
import { QuestionnaireConfig } from '@assessmentis/config-domain/googleFhir'
import * as Base from './Base'

export const Repository = (config: QuestionnaireConfig) =>
  Layer.effect(
    QuestionnaireRepository,
    Effect.gen(function* () {
      const { getAll, create, getById, deleteById } =
        yield* Base.BaseGoogleFhirStoreClient

      const createQuestionnaire: typeof QuestionnaireRepository.Service.createQuestionnaire =
        create('Questionnaire', Questionnaire)

      const getQuestionnaire: typeof QuestionnaireRepository.Service.getQuestionnaire =
        getById('Questionnaire', Questionnaire)

      const getQuestionnaires: typeof QuestionnaireRepository.Service.getQuestionnaires =
        getAll('Questionnaire', Questionnaire)

      const deleteQuestionnaire: typeof QuestionnaireRepository.Service.deleteQuestionnaire =
        deleteById('Questionnaire', Questionnaire)

      return {
        getQuestionnaire,
        createQuestionnaire,
        getQuestionnaires,
        deleteQuestionnaire,
      }
    })
  ).pipe(Layer.provide(Base.LiveClient(config)))
