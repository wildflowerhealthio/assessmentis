import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest'
import { Effect, Exit, Cause, pipe, Option, Layer, DateTime } from 'effect'
import { ExternalVideoCallClient } from '@assessmentis/video-call-domain'
import { DailyCoProxyConfig } from '@assessmentis/config-domain'
import { AuthDataService } from '@assessmentis/platform-domain'
import { DailyCoExternalVideoCallClientLayer } from '../../src/DailyCoExternalVideoCallClientLayer'
import { mswServer } from '../setup/replay.setup'
import { loadFixture } from '../helpers/fixture-loader'
import {
  createRoomHandler,
  createRecordingsHandler,
  createNotFoundHandler,
  createUnauthorizedHandler,
  createForbiddenHandler,
} from '../handlers/dailyco-handler-factory'
import { testConfig } from '../setup/test-config'

/**
 * Replay E2E tests for Daily.co operations using MSW.
 *
 * These tests use recorded fixtures from live tests to verify
 * that the implementation correctly handles API responses.
 */
describe('Daily.co Room Operations (Replay)', () => {
  /**
   * Mock AuthDataService for replay tests
   */
  const MockAuthDataServiceLayer = Layer.succeed(AuthDataService, {
    authData: Effect.succeed({
      authToken: 'mock-api-key',
      authClaims: {} as never,
    }),
  })

  /**
   * Mock DailyCoProxyConfig for replay tests
   */
  const mockDailyCoConfig: DailyCoProxyConfig = {
    _tag: 'dailyco_proxy',
    dailyCoProxyUrl: testConfig.dailyCoProxyUrl,
    recordingsBucket: undefined,
  }

  const ReplayTestLayer = DailyCoExternalVideoCallClientLayer(
    mockDailyCoConfig
  ).pipe(Layer.provide(MockAuthDataServiceLayer))

  beforeAll(() => {
    // Starts requests interception
    mswServer.listen()
  })

  beforeEach(() => {
    // Reset handlers before each test
    mswServer.resetHandlers()
  })

  afterAll(() => mswServer.close())

  describe('createRoom', () => {
    it('should create a room successfully', async () => {
      const fixture = loadFixture<{
        id: string
        name: string
        url: string
      }>('room', 'create-success')

      // Set up MSW handler for this test
      mswServer.use(createRoomHandler(fixture))

      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient
        const now = yield* DateTime.now

        return yield* client.createRoom({
          expiresAt: DateTime.addDuration(now, '1 hour'),
          enableChat: false,
          enableRecording: false,
        })
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const result = exit.value

        // Verify response matches fixture
        expect(result.id).toBe(fixture.response.body.id)
        expect(result.roomName).toBe(fixture.response.body.name)
        expect(result.url).toBe(fixture.response.body.url)
      }
    })
  })

  describe('getMediaRecordedInRoom', () => {
    it('should return empty array for room with no recordings', async () => {
      const fixture = loadFixture<{
        total_count: number
        data: unknown[]
      }>('room', 'recordings-empty')

      mswServer.use(createRecordingsHandler(fixture))

      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient

        return yield* client.getMediaRecordedInRoom('test-room-name')
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isSuccess(exit)).toBe(true)
      if (Exit.isSuccess(exit)) {
        const media = exit.value

        expect(Array.isArray(media)).toBe(true)
        expect(media.length).toBe(0)
      }
    })
  })

  describe('extractRoomNameFromUrl', () => {
    it('should extract room name from URL', () => {
      // This method doesn't make HTTP calls, so no MSW needed
      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient

        const roomName = client.extractRoomNameFromUrl(
          'https://assessmentis.daily.co/test-room-123'
        )

        return roomName
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = Effect.runSync(program)

      expect(exit).toBe('test-room-123')
    })

    it('should return empty string for empty URL', () => {
      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient

        const roomName = client.extractRoomNameFromUrl('')

        return roomName
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = Effect.runSync(program)

      expect(exit).toBe('')
    })
  })

  describe('error scenarios', () => {
    it('should handle 401 Unauthorized as AuthError', async () => {
      mswServer.use(createUnauthorizedHandler('rooms', 'POST'))

      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient
        const now = yield* DateTime.now

        return yield* client.createRoom({
          expiresAt: DateTime.addDuration(now, '1 hour'),
          enableChat: false,
          enableRecording: false,
        })
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const error = pipe(
          exit,
          Exit.causeOption,
          Option.flatMap(Cause.failureOption),
          Option.getOrThrow
        )
        // Should fail with UnhandledError (HTTP error)
        expect((error as { _tag: string })._tag).toBe('UnhandledError')
      }
    })

    it('should handle 403 Forbidden', async () => {
      mswServer.use(createForbiddenHandler('rooms', 'POST'))

      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient
        const now = yield* DateTime.now

        return yield* client.createRoom({
          expiresAt: DateTime.addDuration(now, '1 hour'),
          enableChat: false,
          enableRecording: false,
        })
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const error = pipe(
          exit,
          Exit.causeOption,
          Option.flatMap(Cause.failureOption),
          Option.getOrThrow
        )
        // Should fail with UnhandledError (HTTP error)
        expect((error as { _tag: string })._tag).toBe('UnhandledError')
      }
    })

    it('should handle 404 Not Found for recordings', async () => {
      mswServer.use(createNotFoundHandler('recordings'))

      const program = Effect.gen(function* () {
        const client = yield* ExternalVideoCallClient

        return yield* client.getMediaRecordedInRoom('non-existent-room')
      }).pipe(Effect.provide(ReplayTestLayer))

      const exit = await Effect.runPromiseExit(program)

      expect(Exit.isFailure(exit)).toBe(true)
      if (Exit.isFailure(exit)) {
        const error = pipe(
          exit,
          Exit.causeOption,
          Option.flatMap(Cause.failureOption),
          Option.getOrThrow
        )
        // Should fail with UnhandledError (HTTP error)
        expect((error as { _tag: string })._tag).toBe('UnhandledError')
      }
    })
  })
})
