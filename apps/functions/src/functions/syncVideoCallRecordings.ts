import { onSchedule } from 'firebase-functions/v2/scheduler'
import { info, error as logError } from 'firebase-functions/logger'
import { Exit, Layer } from 'effect'
import { makeAdminRuntime } from '../util/BaseLayer'

/**
 * Scheduled trigger: runs every 24 hours.
 */
export const syncVideoCallRecordingsScheduled = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'northamerica-northeast1',
    memory: '2GiB',
    timeoutSeconds: 540,
  },
  async () => {
    info('Starting scheduled video call recordings sync')
    const runtime = makeAdminRuntime(Layer.empty)
    // TODO: Add a body
    const exit = Exit.fail('Not Implemented')
    // const exit = await runtime.runPromiseExit(syncVideoCallRecordingsEffect)

    Exit.match(exit, {
      onSuccess: (results) => {
        info('Scheduled sync completed successfully', { results })
      },
      onFailure: (cause) => {
        logError('Scheduled sync failed', cause)
      },
    })

    await runtime.dispose()
  }
)
