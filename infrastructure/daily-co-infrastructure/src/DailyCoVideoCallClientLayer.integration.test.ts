import { describe, expect, beforeAll } from 'vitest'
import { it } from '@effect/vitest'
import { Effect } from 'effect'
import {
  VideoCallClient,
  VideoCallRoomName,
} from '@assessmentis/video-call-domain'
import { describeAsVideoCallClient } from '@assessmentis/video-call-domain/interface-tests'
import {
  LiveTestLayer,
  verifyDailyCoAuth,
} from '../test/helpers/integration-setup'

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
  beforeAll(() => {
    // Verify Daily.co API key is configured before running tests
    verifyDailyCoAuth()
    console.log('Testing against Daily.co API')
  })

  describeAsVideoCallClient(LiveTestLayer, {
    roomDomain: 'daily.co',
    testRooms: [
      {
        roomName: VideoCallRoomName.make('n8zIE2Jc19YU1q54LQzz'),
        recordings: 1,
      },
    ],
  })

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
