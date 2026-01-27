import { DailyCoVideoCallClientLayer } from '@assessmentis/daily-co-infrastructure'
import { UnhandledError } from '@assessmentis/ontology'
import { VideoCallClient } from '@assessmentis/video-call-domain'
import { Effect, Layer, Match } from 'effect'
import { LoadedDailyCoSecret } from '@assessmentis/platform-domain'
import { LoadedOrg } from '@assessmentis/platform-domain'
import { DailyCoSecretLayerLive } from './orgSecretLayers'
import { DailyCoContext } from '@assessmentis/config-domain'
import { NodeHttpClient } from '@effect/platform-node'

/**
 * Backend service that resolves VideoCallClient based on org config.
 * Uses direct API access (not proxied) for server-side operations.
 */
export const VideoCallClientLayerLive: Layer.Layer<
  VideoCallClient,
  UnhandledError,
  LoadedOrg | LoadedDailyCoSecret
> = Layer.unwrapEffect(
  Effect.gen(function* () {
    const org = yield* LoadedOrg
    const dailyCoSecret = yield* LoadedDailyCoSecret
    const videoCallClientConfig = org.frontendConfig.videoCallClient

    return Match.value(videoCallClientConfig).pipe(
      Match.tag('daily_co', (dailyCoConf) => {
        const contextLayer = Layer.succeed(DailyCoContext, {
          config: dailyCoConf,
          authHeadersEffect: Effect.sync(() => ({
            Authorization: `Bearer ${dailyCoSecret}`,
          })),
        })

        const l = DailyCoVideoCallClientLayer.pipe(
          Layer.provide(contextLayer),
          Layer.provide(NodeHttpClient.layer)
        )
        return l
      }),
      Match.tag('not_implemented', () =>
        Layer.fail(
          new UnhandledError({
            message: 'Video call client type not yet implemented',
          })
        )
      ),
      Match.exhaustive
    )
  })
)

/**
 * Fully resolved VideoCallClient layer with org and secret dependencies.
 * Compose with CurrentOrgLayerLive to provide CurrentOrg.
 */
export const VideoCallClientLayerFromOrg = VideoCallClientLayerLive.pipe(
  Layer.provide(DailyCoSecretLayerLive)
)
