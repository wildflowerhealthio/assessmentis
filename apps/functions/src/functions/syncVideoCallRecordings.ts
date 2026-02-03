import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onRequest } from 'firebase-functions/v2/https'
import { info, error as logError } from 'firebase-functions/logger'
import { Effect, Exit, Layer } from 'effect'
import { AuthzError } from '@assessmentis/ontology'
import { CurrentUserId } from '@assessmentis/platform-domain'
import { syncVideoCallRecordingsEffect } from '../effects/syncVideoCallRecordingsEffect'
import { makeAdminRuntime, makeAuthedRequestRuntime } from '../util/BaseLayer'

/**
 * Scheduled trigger: runs every 24 hours.
 */
export const syncVideoCallRecordingsScheduled = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'northamerica-northeast2',
    timeoutSeconds: 540,
  },
  async () => {
    info('Starting scheduled video call recordings sync')
    const runtime = makeAdminRuntime(Layer.empty)
    const exit = await runtime.runPromiseExit(syncVideoCallRecordingsEffect)

    Exit.match(exit, {
      onSuccess: (results) => {
        info('Scheduled sync completed successfully', { results })
      },
      onFailure: (cause) => {
        logError('Scheduled sync failed', String(cause))
      },
    })

    await runtime.dispose()
  }
)

/**
 * On-demand HTTP trigger for manual sync.
 */
export const syncVideoCallRecordingsOnDemand = onRequest(
  {
    timeoutSeconds: 540,
    region: 'northamerica-northeast2',
  },
  async (request, response) => {
    info('Starting on-demand video call recordings sync')

    const runtime = makeAuthedRequestRuntime(Layer.empty, { request })

    const exit = await runtime.runPromiseExit(
      Effect.gen(function* () {
        const { userId } = yield* CurrentUserId
        if (userId != 'NYHqWb9dcRg1v2XxijROridZOur2') {
          return yield* Effect.fail(
            new AuthzError({
              message:
                'Unauthorized: only global admins can trigger this function',
            })
          )
        }
        const results = yield* syncVideoCallRecordingsEffect
        return results
      })
    )

    Exit.match(exit, {
      onSuccess: (results) => {
        info('On-demand sync completed successfully', { results })
        response.status(200).json({ status: 'ok', results })
      },
      onFailure: (cause) => {
        logError('On-demand sync failed', String(cause))
        response.status(500).json({ status: 'error', message: String(cause) })
      },
    })

    await runtime.dispose()
  }
)
