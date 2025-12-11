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
    getEncounter(
      encounterId: EncounterId
    ): Effect.Effect<
      WithId<Encounter>,
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | UnhandledError,
      never
    >

    getEncounters(
      params: GetEncounterParams
    ): Effect.Effect<
      WithId<Encounter>[],
      | NotFoundError
      | NeedsAuthenticationError
      | UnhandledError
      | ExternalAssertionError,
      never
    >

    createEncounter(
      encounter: Encounter
    ): Effect.Effect<
      WithId<Encounter>,
      NeedsAuthenticationError | ExternalAssertionError | UnhandledError,
      never
    >

    updateEncounter(
      encounter: WithId<Encounter>
    ): Effect.Effect<
      WithId<Encounter>,
      | NotFoundError
      | NeedsAuthenticationError
      | ExternalAssertionError
      | UnhandledError,
      never
    >

    deleteEncounter(
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
