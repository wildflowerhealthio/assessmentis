import { describe, expect } from 'vitest'
import { it } from '@effect/vitest'
import { Effect, Layer } from 'effect'
import { HttpClient } from '@effect/platform/HttpClient'
import { HttpClientResponse } from '@effect/platform'
import { DailyCoContext } from '@assessmentis/config-domain'
import { LocationRepository } from '@assessmentis/clinical-domain/repositories'
import {
  VideoCallRoomIdentifier,
  VIDEO_CALL_ROOM_NAME_SYSTEM,
  Code,
} from '@assessmentis/clinical-domain/data-types'
import { Location, isVirtualLocation } from '@assessmentis/clinical-domain'
import { DailyCoLocationLayer } from './DailyCoLocationRepository'

const stubContext = Layer.succeed(DailyCoContext, {
  config: {
    _tag: 'daily_co' as const,
    dailyCoProxyUrl: 'http://localhost:3000',
  },
  authHeadersEffect: Effect.succeed({ Authorization: 'Bearer test' }),
})

/**
 * Create a fake HttpClientResponse.
 */
const fakeJsonResponse = (status: number, body: unknown) =>
  ({
    status,
    json: Effect.succeed(body),
    text: Effect.succeed(JSON.stringify(body)),
    request: { url: 'http://test' },
  }) as unknown as HttpClientResponse.HttpClientResponse

describe('DailyCoLocationRepository', () => {
  describe('get', () => {
    const makeTestLayer = (roomData: {
      id: string
      name: string
      url: string
    }) => {
      const stubHttp = Layer.succeed(HttpClient, {
        get: () => Effect.succeed(fakeJsonResponse(200, roomData)),
        post: () => Effect.die('not expected'),
        del: () => Effect.die('not expected'),
      } as unknown as HttpClient)

      return DailyCoLocationLayer.pipe(
        Layer.provide(stubContext),
        Layer.provide(stubHttp)
      )
    }

    it.effect('returns a Location with virtual physicalType', () =>
      Effect.gen(function* () {
        const repo = yield* LocationRepository

        const location = yield* repo.get('test-room')

        expect(isVirtualLocation(location)).toBe(true)
      }).pipe(
        Effect.provide(
          makeTestLayer({
            id: 'room-id-123',
            name: 'test-room',
            url: 'https://assessmentis.daily.co/test-room',
          })
        )
      )
    )

    it.effect('includes VideoCallRoomIdentifier in identifier array', () =>
      Effect.gen(function* () {
        const repo = yield* LocationRepository

        const location = (yield* repo.get('my-room')) as Location

        const roomId = VideoCallRoomIdentifier.findIn(location.identifier)
        expect(roomId).toBeDefined()
        expect(roomId!.value).toBe('my-room')
      }).pipe(
        Effect.provide(
          makeTestLayer({
            id: 'room-id-456',
            name: 'my-room',
            url: 'https://assessmentis.daily.co/my-room',
          })
        )
      )
    )

    it.effect('sets the room URL on the Location', () =>
      Effect.gen(function* () {
        const repo = yield* LocationRepository

        const location = (yield* repo.get('url-test')) as Location

        expect(location.url).toBeDefined()
        expect(location.url!.host).toContain('daily.co')
      }).pipe(
        Effect.provide(
          makeTestLayer({
            id: 'room-id-789',
            name: 'url-test',
            url: 'https://assessmentis.daily.co/url-test',
          })
        )
      )
    )

    it.effect('sets the location name from room name', () =>
      Effect.gen(function* () {
        const repo = yield* LocationRepository

        const location = (yield* repo.get('named-room')) as Location

        expect(location.name).toBe('named-room')
      }).pipe(
        Effect.provide(
          makeTestLayer({
            id: 'id',
            name: 'named-room',
            url: 'https://assessmentis.daily.co/named-room',
          })
        )
      )
    )
  })

  describe('getMany', () => {
    it.effect('returns locations for all rooms', () =>
      Effect.gen(function* () {
        const repo = yield* LocationRepository

        const locations = yield* repo.getMany()

        expect(locations).toHaveLength(2)
      }).pipe(
        Effect.provide(
          DailyCoLocationLayer.pipe(
            Layer.provide(stubContext),
            Layer.provide(
              Layer.succeed(HttpClient, {
                get: () =>
                  Effect.succeed(
                    fakeJsonResponse(200, {
                      data: [
                        {
                          id: 'r1',
                          name: 'room-1',
                          url: 'https://assessmentis.daily.co/room-1',
                        },
                        {
                          id: 'r2',
                          name: 'room-2',
                          url: 'https://assessmentis.daily.co/room-2',
                        },
                      ],
                    })
                  ),
                post: () => Effect.die('not expected'),
                del: () => Effect.die('not expected'),
              } as unknown as HttpClient)
            )
          )
        )
      )
    )
  })
})
