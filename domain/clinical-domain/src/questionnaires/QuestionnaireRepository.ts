import { Effect, Context, Schema } from 'effect'
import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '../errors'
import { Questionnaire, QuestionnaireId } from './models/Questionnaire'
import { WithId } from '../general-purpose'

export const GetQuestionnairesArg = Schema.Struct({})
export type GetQuestionnairesArg = typeof GetQuestionnairesArg.Type
export class QuestionnaireRepository extends Context.Tag(
  'QuestionnaireRepository'
)<
  QuestionnaireRepository,
  {
    create(
      questionnaire: Questionnaire
    ): Effect.Effect<
      Questionnaire,
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >

    get(
      id: QuestionnaireId
    ): Effect.Effect<
      WithId<Questionnaire>,
      | UnhandledError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | NotFoundError,
      never
    >

    getMany(
      params: GetQuestionnairesArg
    ): Effect.Effect<
      WithId<Questionnaire>[],
      UnhandledError | NeedsAuthenticationError | ExternalAssertionError,
      never
    >

    delete(
      id: QuestionnaireId
    ): Effect.Effect<
      object,
      | UnhandledError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | NotFoundError,
      never
    >
  }
>() {}
