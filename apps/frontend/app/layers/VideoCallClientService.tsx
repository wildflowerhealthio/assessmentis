import { DailyCoVideoCallClientLayer } from '@assessmentis/daily-co-infrastructure'
import {
  AuthError,
  BadDataError,
  NotFoundError,
  UnhandledError,
} from '@assessmentis/ontology'
import { VideoCallClient } from '@assessmentis/video-call-domain'
import { Context, Effect, Match } from 'effect'

import {
  Org,
  AuthDataService,
  NoSelectedOrgError,
  OrgSlug,
} from '@assessmentis/platform-domain'
import { DailyCoContext } from '@assessmentis/config-domain'
import { BrowserHttpClient } from '@effect/platform-browser'

export class VideoCallClientService extends Context.Tag(
  'VideoCallClientService'
)<
  VideoCallClientService,
  {
    client: Effect.Effect<
      typeof VideoCallClient.Service,
      AuthError | UnhandledError | NoSelectedOrgError,
      never
    >
  }
>() {}

export const startVideoCallClientService = (
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
          Match.tag('daily_co', (config) =>
            VideoCallClient.pipe(
              Effect.provide(DailyCoVideoCallClientLayer),
              Effect.provide(BrowserHttpClient.layerXMLHttpRequest),
              Effect.provideService(DailyCoContext, {
                config,
                authHeadersEffect: Effect.map(
                  authDataService.authData,
                  ({ authToken }) => ({
                    authorization: `Bearer ${authToken}`,
                  })
                ),
              })
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
