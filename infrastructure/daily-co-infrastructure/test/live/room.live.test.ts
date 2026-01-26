import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { Effect, Exit, DateTime } from 'effect'
import { ExternalVideoCallClient } from '@assessmentis/video-call-domain'
import {
  LiveTestLayer,
  verifyDailyCoApiKey,
  testConfig,
} from '../setup/live.setup'
import { createTracker } from '../helpers/cleanup'
import { createRecorder } from '../helpers/recorder'

/**
 * Live E2E tests for Daily.co room operations.
 *
 * These tests:
 * - Run against the real Daily.co API
 * - Verify structural correctness (data shapes, status codes)
 * - Do NOT make assertions about content (data may vary)
 * - Can record fixtures for replay tests (RECORD_FIXTURES=true)
 *
 * Prerequisites:
 * - .env file with DAILYCO_API_KEY
 */
describe('Daily.co Room Operations (Live)', () => {
  const tracker = createTracker()
  const recorder = createRecorder()

  beforeAll(() => {
    // Verify Daily.co API key is configured before running tests
    verifyDailyCoApiKey()
    console.log(`Testing against Daily.co API: ${testConfig.dailyCoProxyUrl}`)
  })

  afterEach(async () => {
    // Cleanup created rooms (auto-expire, so this is mostly tracking)
    if (tracker.count > 0) {
      await Effect.runPromise(
        tracker.cleanup().pipe(Effect.provide(LiveTestLayer))
      )
    }

    // Flush recorded fixtures
    await recorder.flush('room')
  })

  describe('createRoom', () => {
    it('should create a room and return with ID and URL', async () => {
      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient
        const now = yield* DateTime.now

        const result = yield* client.createRoom({
          expiresAt: DateTime.addDuration(now, '1 hour'),
          enableChat: false,
          enableRecording: false,
        })

        return result
      }).pipe(Effect.provide(LiveTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const result = exit.value

        // Structural assertions
        expect(typeof result.id).toBe('string')
        expect(result.id.length).toBeGreaterThan(0)
        expect(typeof result.roomName).toBe('string')
        expect(result.roomName.length).toBeGreaterThan(0)
        expect(typeof result.url).toBe('string')
        expect(result.url).toContain('daily.co')

        // Track for cleanup
        tracker.track(result.roomName)

        // Record fixture
        recorder.record(
          'create-success',
          {
            method: 'POST',
            endpoint: 'rooms',
            body: {
              properties: {
                exp: Math.floor(Date.now() / 1000) + 3600,
                enable_chat: false,
              },
            },
          },
          {
            status: 200,
            body: {
              id: result.id,
              name: result.roomName,
              url: result.url,
            },
          },
          'Create Room - success response'
        )
      }
    })

    it('should create a room with chat enabled', async () => {
      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient
        const now = yield* DateTime.now

        const result = yield* client.createRoom({
          expiresAt: DateTime.addDuration(now, '1 hour'),
          enableChat: true,
          enableRecording: false,
        })

        return result
      }).pipe(Effect.provide(LiveTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const result = exit.value

        // Structural assertions
        expect(typeof result.id).toBe('string')
        expect(typeof result.roomName).toBe('string')
        expect(typeof result.url).toBe('string')

        // Track for cleanup
        tracker.track(result.roomName)
      }
    })
  })

  describe('extractRoomNameFromUrl', () => {
    it('should extract room name from Daily.co URL', async () => {
      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient
        const now = yield* DateTime.now

        // Create a room first
        const room = yield* client.createRoom({
          expiresAt: DateTime.addDuration(now, '1 hour'),
          enableChat: false,
          enableRecording: false,
        })

        tracker.track(room.roomName)

        // Extract room name from URL
        const extractedName = client.extractRoomNameFromUrl(room.url)

        return { roomName: room.roomName, extractedName }
      }).pipe(Effect.provide(LiveTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const { roomName, extractedName } = exit.value

        // Should extract the same room name
        expect(extractedName).toBe(roomName)
      }
    })
  })

  describe('getMediaRecordedInRoom', () => {
    it('should return empty array for room with no recordings', async () => {
      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient
        const now = yield* DateTime.now

        // Create a new room (no recordings yet)
        const room = yield* client.createRoom({
          expiresAt: DateTime.addDuration(now, '1 hour'),
          enableChat: false,
          enableRecording: false,
        })

        tracker.track(room.roomName)

        // Get recordings for this room
        const media = yield* client.getMediaRecordedInRoom(room.roomName)

        return { roomName: room.roomName, media }
      }).pipe(Effect.provide(LiveTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const { roomName, media } = exit.value

        // Structural assertions
        expect(Array.isArray(media)).toBe(true)
        // New room should have no recordings
        expect(media.length).toBe(0)

        // Record fixture
        recorder.record(
          'recordings-empty',
          {
            method: 'GET',
            endpoint: 'recordings',
            params: { room_name: roomName },
          },
          {
            status: 200,
            body: {
              total_count: 0,
              data: [],
            },
          },
          'Get Recordings - empty response'
        )
      }
    })
  })
})
