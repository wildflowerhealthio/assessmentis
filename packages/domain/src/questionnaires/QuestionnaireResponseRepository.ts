import { Effect, Context } from "effect";
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from "../errors";
import {
  QuestionnaireResponse,
  QuestionnaireResponseId,
} from "./models/QuestionnaireResponse";
import { WithId } from "../general-purpose";

export class QuestionnaireResponseRepository extends Context.Tag(
  "QuestionnaireResponseRepository",
)<
  QuestionnaireResponseRepository,
  {
    createQuestionnaireResponses: (
      questionnaireResponses: QuestionnaireResponse[],
    ) => Effect.Effect<
      ReadonlyArray<QuestionnaireResponse>,
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >;

    getQuestionnaireResponse: (
      id: QuestionnaireResponseId,
    ) => Effect.Effect<
      QuestionnaireResponse,
      | UnhandledError
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError,
      never
    >;

    getQuestionnaireResponses: (
      args?: unknown,
    ) => Effect.Effect<
      ReadonlyArray<QuestionnaireResponse>,
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >;

    deleteQuestionnaireResponse: (
      id: QuestionnaireResponseId,
    ) => Effect.Effect<
      object,
      | UnhandledError
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError,
      never
    >;

    updateQuestionnaireResponse: (
      questionnaireResponse: WithId<QuestionnaireResponse>,
    ) => Effect.Effect<
      WithId<QuestionnaireResponse>,
      | UnhandledError
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError,
      never
    >;
  }
>() {}
