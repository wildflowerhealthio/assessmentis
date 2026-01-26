import { DailyCoExternalVideoCallClientLayer } from '@assessmentis/daily-co-infrastructure'
import {
  AuthError,
  BadDataError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { ExternalVideoCallClient } from '@assessmentis/video-call-domain'
import { Context, Effect, Match } from 'effect'

import {
  Org,
  AuthDataService,
  NoSelectedOrgError,
  OrgSlug,
} from '@assessmentis/platform-domain'

export class ExternalVideoCallClientService extends Context.Tag(
  'ExternalVideoCallClientService'
)<
  ExternalVideoCallClientService,
  {
    client: Effect.Effect<
      typeof ExternalVideoCallClient.Service,
      AuthError | UnhandledError | NoSelectedOrgError,
      never
    >
  }
>() {}

export const startExternalVideoCallClientService = (
  authDataService: typeof AuthDataService.Service,
  org: Effect.Effect<
    Org,
    | AuthError
    | UnhandledError
    | NoSelectedOrgError
    | BadDataError
    | NotFoundError<'Org', { orgSlug: OrgSlug }>
  >
) =>
  Effect.succeed({
    client: org.pipe(
      Effect.flatMap(({ frontendConfig }) =>
        Match.value(frontendConfig.videoCallClient).pipe(
          Match.tag('daily_co_proxy', (dailyCoConf) =>
            ExternalVideoCallClient.pipe(
              Effect.provide(DailyCoExternalVideoCallClientLayer(dailyCoConf)),
              Effect.provideService(AuthDataService, authDataService)
            )
          ),
          Match.tag('not_implemented', () =>
            Effect.fail(
              new UnhandledError({
                message: 'FHIR server type not yet implemented',
              })
            )
          ),
          Match.exhaustive
        )
      ),
      Effect.mapError((e) =>
        e instanceof BadDataError || e instanceof NotFoundError
          ? e.asUnhandledError()
          : e
      )
    ),
  })
