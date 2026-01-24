import { FhirR4Client } from '@assessmentis/fhir-client'
import {
  LoadedGapiClient,
  LoadedGapiHealthcareClient,
  startGapiGoogleHealthcareClient,
} from '@assessmentis/google-fhir-web-infrastructure'
import {
  AuthError,
  UnhandledError,
  NotFoundError,
  ExternalAssertionError,
  BadDataError,
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
import { NoSelectedOrgError, OrgSlug } from '@assessmentis/platform-domain'
import { Org } from '@assessmentis/platform-domain'
import {
  takeOneFromPubSubOrDie,
  pubsubAsPerpetualStream,
} from '@assessmentis/util'

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
  >
): Effect.Effect<
  typeof FhirR4ClientService.Service,
  never,
  Scope.Scope | LoadedGapiClient | LoadedGapiHealthcareClient
> =>
  Effect.gen(function* () {
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
                const e = startGapiGoogleHealthcareClient.pipe(
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
