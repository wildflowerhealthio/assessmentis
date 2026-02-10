import {
  afterEach,
  beforeEach,
  describe,
  expect,
  SuiteCollector,
  SuiteFactory,
} from 'vitest'
import { it } from '@effect/vitest'
import {
  Effect,
  Exit,
  Cause,
  pipe,
  Option,
  TestClock,
  Layer,
  DateTime,
  Console,
} from 'effect'
import {
  VideoCallClient,
  VideoCallRoomName,
} from '@assessmentis/video-call-domain'

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
  }[]
}

export const describeAsVideoCallClient = (
  VideoCallClientLayer: Layer.Layer<VideoCallClient, never, never>,
  {
    roomDomain = null,
    testTime = '2026-02-03T04:00:00.000Z',
    testRooms = [],
    nonExistentRoomName = VideoCallRoomName.make('non-existent-room-ccf5e9ad'),
  }: DescribeAsVideoCallClientOptions,
  fn?: SuiteFactory<object> | undefined
): SuiteCollector<object> => {
  let roomsToDelete: VideoCallRoomName[] = []

  beforeEach(() => {
    roomsToDelete = []
  })

  afterEach(() =>
    Effect.runPromise(
      Effect.gen(function* () {
        const client = yield* VideoCallClient

        for (const roomName of roomsToDelete) {
          // Attempt to delete, ignore NotFoundError
          const exit = yield* Effect.exit(client.deleteRoom(roomName))

          if (Exit.isFailure(exit)) {
            yield* Console.warn(
              `Failed to delete room ${roomName} during cleanup`
            )
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
        Effect.gen(function* () {
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
              Option.flatMap(Cause.failureOption),
              Option.getOrThrow
            )
            expect((error as { _tag: string })._tag).toBe('NotFoundError')
          }
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('createRoom', () => {
      it.effect('should create a room and return room details', () =>
        Effect.gen(function* () {
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
        Effect.gen(function* () {
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
        Effect.gen(function* () {
          const client = yield* VideoCallClient

          const exit = yield* Effect.exit(client.getRoom(nonExistentRoomName))

          expect(Exit.isFailure(exit)).toBe(true)
          if (Exit.isFailure(exit)) {
            const error = pipe(
              exit,
              Exit.causeOption,
              Option.flatMap(Cause.failureOption),
              Option.getOrThrow
            )
            expect((error as { _tag: string })._tag).toBe('NotFoundError')
          }
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('extractRoomNameFromUrl', () => {
      it.effect('should return undefined for empty URL', () =>
        Effect.gen(function* () {
          const client = yield* VideoCallClient

          const roomName = client.extractRoomNameFromUrl('')

          expect(roomName).toBeUndefined()
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('getMediaRecordedInRoom', () => {
      it.effect('should return empty array for a newly created room', () =>
        Effect.gen(function* () {
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
          Effect.gen(function* () {
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
        Effect.gen(function* () {
          const client = yield* VideoCallClient

          const recordings = yield* client.listAllRecordings()

          expect(Array.isArray(recordings)).toBe(true)
          expect(recordings.length).toBeGreaterThan(0)
          // If there are recordings, verify structure
          const first = recordings[0]
          expect(first.media.resourceType).toBe('Media')
          expect(first.media.status).toBe('completed')
          expect(typeof first.roomName).toBe('string')
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })

    describe('listAllTranscripts', () => {
      it.effect('should return an array of transcripts', () =>
        Effect.gen(function* () {
          const client = yield* VideoCallClient

          const transcripts = yield* client.listAllTranscripts()

          expect(Array.isArray(transcripts)).toBe(true)

          // If there are transcripts, verify structure
          if (transcripts.length > 0) {
            const first = transcripts[0]
            expect(first.media.resourceType).toBe('Media')
            expect(first.media.status).toBe('completed')
            expect(typeof first.roomName).toBe('string')
          }
        }).pipe(Effect.provide(VideoCallClientLayer))
      )
    })
  })
}
