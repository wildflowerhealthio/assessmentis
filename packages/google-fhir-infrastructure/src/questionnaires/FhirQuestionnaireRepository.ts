import { Layer, Effect } from "effect";
import { 
  Questionnaire, 
  QuestionnaireRepository 
} from "assessmentis-domain"
import {
  FhirClient,
  LiveFhirClient,
} from "../FhirLiveLayer";

export const FhirQuestionnaireRepository = Layer.effect(
  QuestionnaireRepository,
  Effect.gen(function* () {
    const { getAll, create, getById, deleteById } = yield* FhirClient;

    const createQuestionnaire: typeof QuestionnaireRepository.Service.createQuestionnaire =
      create("Questionnaire", Questionnaire);

    const getQuestionnaire: typeof QuestionnaireRepository.Service.getQuestionnaire =
      getById("Questionnaire", Questionnaire);

    const getQuestionnaires: typeof QuestionnaireRepository.Service.getQuestionnaires =
      getAll("Questionnaire", Questionnaire);

    const deleteQuestionnaire: typeof QuestionnaireRepository.Service.deleteQuestionnaire =
      deleteById("Questionnaire", Questionnaire);

    return {
      getQuestionnaire,
      createQuestionnaire,
      getQuestionnaires,
      deleteQuestionnaire,
    };
  }),
).pipe(Layer.provide(LiveFhirClient));
