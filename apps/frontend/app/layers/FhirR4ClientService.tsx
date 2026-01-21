import { FhirR4Client } from '@assessmentis/clinical-domain/assessmentis'
import {
  LoadedGapiClient,
  LoadedGapiHealthcareClient,
  startGapiGoogleHealthcareClient,
} from '@assessmentis/google-fhir-web-infrastructure'
import {
  UnhandledError,
  NotFoundError,
  ExternalAssertionError,
} from '@assessmentis/ontology'
import {
  Context,
  Effect,
  Either,
  Fiber,
  Match,
  PubSub,
  Scope,
  Stream,
  Take,
} from 'effect'
import { LoadedGoogleFhirConfig } from '@assessmentis/config-domain'
import { AuthError } from '@assessmentis/platform-domain'
import { NoSelectedOrgError } from '@assessmentis/platform-domain'
import { Org } from '@assessmentis/platform-domain'
import {
  takeOneFromPubSubOrDie,
  pubsubAsPerpetualStream,
} from '@assessmentis/util'

export const createFhirR4ClientPubSub = PubSub.sliding<
  Take.Take<
    Either.Either<
      typeof FhirR4Client.Service,
      | NoSelectedOrgError
      | AuthError
      | UnhandledError
      | NotFoundError
      | ExternalAssertionError
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
      | NoSelectedOrgError
      | AuthError
      | UnhandledError
      | NotFoundError
      | ExternalAssertionError,
      never
    >
    clientStream: Stream.Stream<
      Either.Either<
        typeof FhirR4Client.Service,
        | NoSelectedOrgError
        | AuthError
        | UnhandledError
        | NotFoundError
        | ExternalAssertionError
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
        | NoSelectedOrgError
        | AuthError
        | UnhandledError
        | NotFoundError
        | ExternalAssertionError
      >
    >
  >,
  orgStream: Stream.Stream<
    Either.Either<
      Org,
      NoSelectedOrgError | AuthError | UnhandledError | NotFoundError
    >,
    never,
    Scope.Scope
  >
): Effect.Effect<
  typeof FhirR4ClientService.Service,
  never,
  Scope.Scope | LoadedGapiClient | LoadedGapiHealthcareClient
> =>
  Effect.gen(function* () {
    const clientStream = orgStream.pipe(
      Stream.map(
        Either.map(
          ({
            frontendConfig,
          }): Effect.Effect<
            typeof FhirR4Client.Service,
            | NoSelectedOrgError
            | AuthError
            | UnhandledError
            | NotFoundError
            | ExternalAssertionError,
            Scope.Scope | LoadedGapiClient | LoadedGapiHealthcareClient
          > =>
            Match.value(frontendConfig.fhirServer).pipe(
              Match.tag('google_fhir_store', (googleConf) => {
                const e = startGapiGoogleHealthcareClient.pipe(
                  Effect.provideService(LoadedGoogleFhirConfig, googleConf)
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
