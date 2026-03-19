import { it } from '@effect/vitest'
import { Cause, Console, Effect, Exit, Option, TestClock, pipe } from 'effect'
import type { DateTime, Layer } from 'effect'
import { afterEach, beforeEach, describe, expect } from 'vitest'
import type { SuiteCollector, SuiteFactory } from 'vitest'

import { VideoCallClient, VideoCallRoomName } from '@assessmentis/video-call-domain'

export interface DescribeAsVideoCallClientOptions {
  /**
   * A Root domain expected to appear in room URLs (e.g., "daily.co")
   * If null, only the presence of a URL is checked.
   */
  roomDomain: string | null
  /**
   * A fixed time to set in the TestClock for deterministic tests
   * (Optional; if not provided, tests use 2036-02-03T04:00:00.000Z
   */
  testTime?: DateTime.DateTime.Input
  /**
   * A room name that is known not to exist (for NotFoundError tests)
   */
  nonExistentRoomName?: VideoCallRoomName
  /**
   * A selection of known rooms and some properties to test against
   */
  testRooms: {
    roomName: VideoCallRoomName
    recordings: number
    transcriptions: number
  }[]
}

export const describeAsVideoCallClient = (
  VideoCallClientLayer: Layer.Layer<VideoCallClient, never>,
  {
    roomDomain = null,
    testTime = '2029-02-03T04:00:00.000Z',
    testRooms = [],
    nonExistentRoomName = VideoCallRoomName.make('non-existent-room-ccf5e9ad'),
  }: DescribeAsVideoCallClientOptions,
  fn?: SuiteFactory
): SuiteCollector => {
  let roomsToDelete: VideoCallRoomName[] = []

  beforeEach(() => {
    roomsToDelete = []
  })

  afterEach(() =>
    Effect.runPromise(
      Effect.gen(function* cleanupRooms() {
        const client = yield* VideoCallClient

        for (const roomName of roomsToDelete) {
          // Attempt to delete, ignore NotFoundError
          const exit = yield* Effect.exit(client.deleteRoom(roomName))

          if (Exit.isFailure(exit)) {
            yield* Console.warn(`Failed to delete room ${roomName} during cleanup`)
          }
        }
      }).pipe(Effect.provide(VideoCallClientLayer))
    )
  )
  const deleteRoomAfterTest = (roomName: VideoCallRoomName) => {
    roomsToDelete.push(roomName)
  }

  return describe('complies with VideoCallClient interface', (testApi) => {
    fn?.(testApi)

    describe('deleteRoom', () => {
      it.effect('should be able to delete a room and see it 404', () =>
        Effect.gen(function* deleteRoomTest() {
          const client = yield* VideoCallClient
          yield* TestClock.setTime(testTime)
          const room = yield* client.createRoom({
            enableChat: true,
            enableRecording: false,
          })

          yield* client.deleteRoom(room.roomName)

          // Verify it 404s when fetching
          const exit = yield* Effect.exit(client.getRoom(room.roomName))
          expect(Exit.isFailure(exit)).toBe(true)
          if (Exit.isFailure(exit)) {
            const error = pipe(
              exit,
              Exit.causeOption,
              Option.flatMap((cause) => Cause.failureOption(cause)),
              Option.getOrThrow
            )
            expect(error._tag).toBe('NotFoundError')
          }
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('createRoom', () => {
      it.effect('should create a room and return room details', () =>
        Effect.gen(function* createRoomTest() {
          const client = yield* VideoCallClient
          yield* TestClock.setTime(testTime)
          yield* TestClock.adjust('15 seconds')
          const room = yield* client.createRoom({
            enableChat: true,
            enableRecording: false,
          })
          deleteRoomAfterTest(room.roomName)

          // Structural assertions
          expect(room.id).toBeTypeOf('string')
          expect(room.id).toBeTruthy()
          expect(room.roomName).toBeTypeOf('string')
          expect(room.roomName).toBeTruthy()
          expect(room.url).toBeTypeOf('string')
          if (roomDomain) {
            expect(room.url).toContain(roomDomain)
          } else {
            expect(room.url).toBeTruthy()
          }
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('getRoom', () => {
      it.effect('should get an newly created room by name', () =>
        Effect.gen(function* getRoomTest() {
          const client = yield* VideoCallClient
          yield* TestClock.setTime(testTime)
          const created = yield* client.createRoom({
            enableChat: false,
            enableRecording: false,
          })
          deleteRoomAfterTest(created.roomName)
          // Then get it by name
          const fetched = yield* client.getRoom(created.roomName)

          // Structural assertions
          expect(fetched.id).toBe(created.id)
          expect(fetched.roomName).toBe(created.roomName)
          expect(fetched.url).toBe(created.url)
        }).pipe(Effect.provide(VideoCallClientLayer))
      )

      it.effect('should return NotFoundError for non-existent room', () =>
        Effect.gen(function* getRoomNotFoundTest() {
          const client = yield* VideoCallClient

          const exit = yield* Effect.exit(client.getRoom(nonExistentRoomName))

          expect(Exit.isFailure(exit)).toBe(true)
          if (Exit.isFailure(exit)) {
            const error = pipe(
              exit,
              Exit.causeOption,
              Option.flatMap((cause) => Cause.failureOption(cause)),
              Option.getOrThrow
            )
            expect(error._tag).toBe('NotFoundError')
          }
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('extractRoomNameFromUrl', () => {
      it.effect('should return undefined for empty URL', () =>
        Effect.gen(function* extractRoomNameFromUrlTest() {
          const client = yield* VideoCallClient

          const roomName = client.extractRoomNameFromUrl('')

          expect(roomName).toBeUndefined()
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('getMediaRecordedInRoom', () => {
      it.effect('should return empty array for a newly created room', () =>
        Effect.gen(function* getMediaRecordedInRoomEmptyTest() {
          const client = yield* VideoCallClient

          // Create a fresh room (will have no recordings)
          yield* TestClock.setTime(testTime)
          const room = yield* client.createRoom({
            enableChat: false,
            enableRecording: false,
          })
          deleteRoomAfterTest(room.roomName)

          // Get recordings for the room
          const media = yield* client.getMediaRecordedInRoom(room.roomName)

          expect(Array.isArray(media)).toBe(true)
          expect(media.length).toBe(0)
        }).pipe(Effect.provide(VideoCallClientLayer))
      )

      it.effect.each(testRooms)(
        'should should return $recordings recordings for %s',
        ({ recordings: expectedRecordings, roomName }) =>
          Effect.gen(function* getMediaRecordedInRoomTest() {
            const client = yield* VideoCallClient

            // Get recordings for the room
            const media = yield* client.getMediaRecordedInRoom(roomName)

            expect(Array.isArray(media)).toBe(true)
            expect(media.length).toBe(expectedRecordings)
          }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('listAllRecordings', () => {
      it.effect('should return an array of recordings', () =>
        Effect.gen(function* listAllRecordingsTest() {
          const client = yield* VideoCallClient

          const recordings = yield* client.listAllRecordings()

          expect(Array.isArray(recordings)).toBe(true)
          expect(recordings.length).toBeGreaterThan(0)
          // If there are recordings, verify structure
          const first = recordings[0]
          expect(first.media.domainType).toBe('Media')
          expect(first.media.status).toBe('completed')
          expect(typeof first.roomName).toBe('string')
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('createRoomToken + parseMeetingToken', () => {
      it.effect('should create and parse a non-owner token for a room', () =>
        Effect.gen(function* createAndParseNonOwnerTokenTest() {
          const client = yield* VideoCallClient
          yield* TestClock.setTime(testTime)

          const room = yield* client.createRoom({
            enableChat: false,
            enableRecording: false,
          })
          deleteRoomAfterTest(room.roomName)

          const token = yield* client.createRoomToken({
            roomName: room.roomName,
          })

          expect(token).toBeTypeOf('string')
          expect(token.length).toBeGreaterThan(0)

          const parsed = yield* client.parseMeetingToken(token)

          expect(parsed.roomName).toBe(room.roomName)
          expect(parsed.isOwner).toBe(false)
        }).pipe(Effect.provide(VideoCallClientLayer))
      )

      it.effect('should create and parse an owner token for a room', () =>
        Effect.gen(function* createAndParseOwnerTokenTest() {
          const client = yield* VideoCallClient
          yield* TestClock.setTime(testTime)

          const room = yield* client.createRoom({
            enableChat: false,
            enableRecording: false,
          })
          deleteRoomAfterTest(room.roomName)

          const token = yield* client.createRoomToken({
            is_owner: true,
            roomName: room.roomName,
          })

          expect(token).toBeTypeOf('string')
          expect(token.length).toBeGreaterThan(0)

          const parsed = yield* client.parseMeetingToken(token)

          expect(parsed.roomName).toBe(room.roomName)
          expect(parsed.isOwner).toBe(true)
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('listAllTranscripts', () => {
      it.effect('should return an array of transcripts', () =>
        Effect.gen(function* listAllTranscriptsTest() {
          const client = yield* VideoCallClient

          const transcripts = yield* client.listAllTranscripts()

          expect(Array.isArray(transcripts)).toBe(true)

          // If there are transcripts, verify structure
          if (transcripts.length === 0) {
            return expect.fail(
              'No transcripts found, cannot verify structure of transcript objects'
            )
          }
          const first = transcripts[0]
          expect(first.media.domainType).toBe('Media')
          expect(first.media.status).toBe('completed')
          expect(typeof first.roomName).toBe('string')
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })
  })
}
