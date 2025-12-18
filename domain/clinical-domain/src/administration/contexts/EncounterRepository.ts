import { Context, Effect } from 'effect'
import { Encounter, EncounterId } from '../resources/Encounter'

import {
  ExternalAssertionError,
  NeedsAuthenticationError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { WithId } from '../../data-types/base/Element'

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
      params?: Encounter
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
