import { Effect, Context, Schema } from "effect";
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from "../errors";
import { Questionnaire, QuestionnaireId } from "./models/Questionnaire";

export const GetQuestionnairesArg = Schema.Struct({});
export type GetQuestionnairesArg = typeof GetQuestionnairesArg.Type;
export class QuestionnaireRepository extends Context.Tag(
  "QuestionnaireRepository",
)<
  QuestionnaireRepository,
  {
    createQuestionnaire(
      questionnaire: Questionnaire,
    ): Effect.Effect<
      Questionnaire,
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >;

    getQuestionnaire(
      id: QuestionnaireId,
    ): Effect.Effect<
      Questionnaire,
      | UnhandledError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | NotFoundError,
      never
    >;

    getQuestionnaires(
      params: GetQuestionnairesArg,
    ): Effect.Effect<
      Questionnaire[],
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >;

    deleteQuestionnaire(
      id: QuestionnaireId,
    ): Effect.Effect<
      object,
      | UnhandledError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | NotFoundError,
      never
    >;
  }
>() {}
