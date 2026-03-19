import { Exit, Layer } from 'effect'
import { info, error as logError } from 'firebase-functions/logger'
import { onSchedule } from 'firebase-functions/v2/scheduler'

import { makeAdminRuntime } from '../util/base-layer'

/**
 * Scheduled trigger: runs every 24 hours.
 */
export const syncVideoCallRecordingsScheduled = onSchedule(
  {
    memory: '2GiB',
    region: 'northamerica-northeast1',
    schedule: 'every 24 hours',
    timeoutSeconds: 540,
  },
  async () => {
    info('Starting scheduled video call recordings sync')
    const runtime = makeAdminRuntime(Layer.empty)
    // TODO: Add a body
    const exit = Exit.fail('Not Implemented')
    // oxfmt-ignore
    // const exit = await runtime.runPromiseExit(syncVideoCallRecordingsEffect)

    Exit.match(exit, {
      onFailure: (cause) => {
        logError('Scheduled sync failed', cause)
      },
      onSuccess: (results) => {
        info('Scheduled sync completed successfully', { results })
      },
    })

    await runtime.dispose()
  }
)
