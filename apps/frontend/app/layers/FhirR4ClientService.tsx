import {
  Context,
  Effect,
  Either,
  Equal,
  Fiber,
  Match,
  PubSub,
  Stream,
  type Scope,
  type Take,
} from 'effect'

import type { ResourceDataTypes } from '@assessmentis/clinical-domain'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { ReadonlyUrl, type Hub } from '@assessmentis/effectful-store'
import {
  startGapiGoogleHealthcareClient,
  type LoadedGapiClient,
  type LoadedGapiHealthcareClient,
} from '@assessmentis/google-fhir-web-infrastructure'
import {
  BadDataError,
  ExternalAssertionError,
  NotFoundError,
  UnhandledError,
  type AuthError,
} from '@assessmentis/ontology'
import type {
  NoSelectedOrgError,
  Org,
  OrgSlug,
} from '@assessmentis/platform-domain'
import {
  pubsubAsPerpetualStream,
  takeOneFromPubSubOrDie,
} from '@assessmentis/util'

import {
  makeFhirR4ReadyOrigin,
  type FhirR4Client,
} from '../../../../domain/fhir-r4/src'

export const createFhirR4ClientPubSub = PubSub.sliding<
  Take.Take<
    Either.Either<
      typeof FhirR4Client.Service,
      NoSelectedOrgError | AuthError | UnhandledError
    >
  >
>({
  capacity: 1,
  replay: 1,
})

export class FhirR4ClientService extends Context.Tag('FhirR4ClientService')<
  FhirR4ClientService,
  {
    client: Effect.Effect<
      typeof FhirR4Client.Service,
      NoSelectedOrgError | AuthError | UnhandledError | ExternalAssertionError,
      never
    >
    clientStream: Stream.Stream<
      Either.Either<
        typeof FhirR4Client.Service,
        NoSelectedOrgError | AuthError | UnhandledError | ExternalAssertionError
      >,
      never,
      Scope.Scope
    >
    shutdown: Effect.Effect<void>
  }
>() {}

export const startFhirR4ClientService = (
  clientPubSub: PubSub.PubSub<
    Take.Take<
      Either.Either<
        typeof FhirR4Client.Service,
        NoSelectedOrgError | AuthError | UnhandledError
      >
    >
  >,
  orgStream: Stream.Stream<
    Either.Either<
      Org,
      | NoSelectedOrgError
      | AuthError
      | UnhandledError
      | BadDataError
      | NotFoundError<'Org', { orgSlug: OrgSlug }>
    >,
    never,
    Scope.Scope
  >,
  hub: Hub.Hub<ResourceDataTypes>
): Effect.Effect<
  typeof FhirR4ClientService.Service,
  never,
  Scope.Scope | LoadedGapiClient | LoadedGapiHealthcareClient
> =>
  Effect.gen(function* () {
    let lastRegistered: null | ReadonlyUrl = null
    const clientStream = orgStream.pipe(
      Stream.map(
        Either.mapLeft((e) =>
          e instanceof ExternalAssertionError ||
          e instanceof NotFoundError ||
          e instanceof BadDataError
            ? e.asUnhandledError()
            : e
        )
      ),
      Stream.map(
        Either.map(
          ({
            frontendConfig,
          }): Effect.Effect<
            typeof FhirR4Client.Service,
            NoSelectedOrgError | AuthError | UnhandledError,
            Scope.Scope | LoadedGapiClient | LoadedGapiHealthcareClient
          > =>
            Match.value(frontendConfig.fhirServer).pipe(
              Match.tag('google_fhir_store', (googleConf) => {
                const e = startGapiGoogleHealthcareClient(hub).pipe(
                  Effect.provideService(LoadedGoogleFhirConfig, googleConf),
                  Effect.mapError((e) =>
                    e instanceof ExternalAssertionError
                      ? e.asUnhandledError()
                      : e
                  )
                )
                return e
              }),
              Match.tag('not_implemented', () =>
                Effect.fail(
                  new UnhandledError({
                    message: 'FHIR server type not yet implemented',
                  })
                )
              ),
              Match.exhaustive
            )
        )
      ),
      Stream.map(Effect.flatten),
      Stream.mapEffect(Effect.either)
    )

    const clientPubSubFiber = yield* Effect.forkDaemon(
      Stream.runIntoPubSub(clientPubSub)(clientStream)
    )

    const shutdown = Effect.gen(function* () {
      yield* clientPubSub.shutdown
      yield* Fiber.join(clientPubSubFiber)
    })

    const service: typeof FhirR4ClientService.Service = {
      client: takeOneFromPubSubOrDie(clientPubSub),
      clientStream: pubsubAsPerpetualStream(clientPubSub),
      shutdown,
    }

    return service
  })
