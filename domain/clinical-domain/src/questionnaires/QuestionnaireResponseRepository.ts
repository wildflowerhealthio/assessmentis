import { Effect, Context } from 'effect'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '../errors'
import {
  QuestionnaireResponse,
  QuestionnaireResponseId,
} from './models/QuestionnaireResponse'
import { WithId } from '../general-purpose'

export class QuestionnaireResponseRepository extends Context.Tag(
  'QuestionnaireResponseRepository'
)<
  QuestionnaireResponseRepository,
  {
    createMany: (
      questionnaireResponses: QuestionnaireResponse[]
    ) => Effect.Effect<
      ReadonlyArray<QuestionnaireResponse>,
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >

    get: (
      id: QuestionnaireResponseId
    ) => Effect.Effect<
      QuestionnaireResponse,
      | UnhandledError
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError,
      never
    >

    getMany: (
      args?: unknown
    ) => Effect.Effect<
      ReadonlyArray<QuestionnaireResponse>,
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >

    delete: (
      id: QuestionnaireResponseId
    ) => Effect.Effect<
      object,
      | UnhandledError
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError,
      never
    >

    update: (
      questionnaireResponse: WithId<QuestionnaireResponse>
    ) => Effect.Effect<
      WithId<QuestionnaireResponse>,
      | UnhandledError
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError,
      never
    >
  }
>() {}
