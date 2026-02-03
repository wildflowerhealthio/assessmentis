import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onRequest } from 'firebase-functions/v2/https'
import { info, error as logError } from 'firebase-functions/logger'
import { Exit, Layer, ManagedRuntime } from 'effect'
import { FetchHttpClient } from '@effect/platform'
import {
  FirebaseAdmin,
  FirebaseAdminDocumentStoreLayer,
} from '@assessmentis/firebase-server-infrastructure'
import { syncVideoCallRecordingsEffect } from '../effects/syncVideoCallRecordingsEffect'

/**
 * Runtime for sync functions (no FunctionsContext/auth needed).
 */
const makeSyncRuntime = () =>
  ManagedRuntime.make(
    Layer.mergeAll(
      FetchHttpClient.layer,
      FirebaseAdminDocumentStoreLayer,
      FirebaseAdmin.Default
    )
  )

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

    const runtime = makeSyncRuntime()
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
  async (_request, response) => {
    response.status(403).json({ status: 'error', message: 'Not Authorized' })
    return

    info('Starting on-demand video call recordings sync')

    const runtime = makeSyncRuntime()
    const exit = await runtime.runPromiseExit(syncVideoCallRecordingsEffect)

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
