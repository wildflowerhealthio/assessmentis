import { Context, Data, Effect, Schema } from 'effect'
import { Encounter, EncounterId } from './models/Encounter'

import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '../errors'
import { WithId } from '../general-purpose'

export class EncounterError extends Data.TaggedError('EncounterError')<{
  message: string
  cause?: unknown
}> {}

export class EncounterNotFound extends Data.TaggedError('EncounterNotFound')<{
  encounterId?: EncounterId
}> {}

const GetEncounterParams = Schema.Struct({})
type GetEncounterParams = typeof GetEncounterParams.Type

export class EncounterRepository extends Context.Tag('EncounterRepository')<
  EncounterRepository,
  {
    get(
      encounterId: EncounterId
    ): Effect.Effect<
      WithId<Encounter>,
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | UnhandledError,
      never
    >

    getMany(
      params: GetEncounterParams
    ): Effect.Effect<
      WithId<Encounter>[],
      | NotFoundError
      | NeedsAuthenticationError
      | UnhandledError
      | ExternalAssertionError,
      never
    >

    create(
      encounter: Encounter
    ): Effect.Effect<
      WithId<Encounter>,
      NeedsAuthenticationError | ExternalAssertionError | UnhandledError,
      never
    >

    update(
      encounter: WithId<Encounter>
    ): Effect.Effect<
      WithId<Encounter>,
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | UnhandledError,
      never
    >

    delete(
      encounterId: EncounterId
    ): Effect.Effect<
      object,
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | UnhandledError,
      never
    >
  }
>() {}
