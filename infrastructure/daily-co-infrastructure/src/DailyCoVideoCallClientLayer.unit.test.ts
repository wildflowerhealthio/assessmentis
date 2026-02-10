import { describe, expect } from 'vitest'
import { it } from '@effect/vitest'
import { Effect } from 'effect'
import { VideoCallClient } from '@assessmentis/video-call-domain'
import { LiveTestLayer } from '../test/helpers/integration-setup'

/**
 * Integration tests for Daily.co VideoCallClient operations.
 *
 * These tests:
 * - Run against the real Daily.co API (in record mode)
 * - Verify structural correctness (data shapes, response types)
 * - Can record cassettes for replay tests (RECORD=true)
 *
 * Prerequisites:
 * - DAILY_CO_API_KEY environment variable set
 */
describe('DailyCoVideoCallClientLayer', () => {
  describe('extractRoomNameFromUrl', () => {
    it.effect('should extract room name from Daily.co URL', () =>
      Effect.gen(function* () {
        const client = yield* VideoCallClient

        const roomName = client.extractRoomNameFromUrl(
          'https://assessmentis.daily.co/test-room'
        )

        expect(roomName).toBe('test-room')
      }).pipe(Effect.provide(LiveTestLayer))
    )
  })
})
