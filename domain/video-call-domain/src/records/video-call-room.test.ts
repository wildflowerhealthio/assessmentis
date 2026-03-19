import { Either, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { VideoCallRoom, VideoCallRoomId, VideoCallRoomName } from './video-call-room'

describe('VideoCallRoom Models', () => {
  describe('VideoCallRoomId', () => {
    test('property: all strings decode successfully', () => {
      fc.assert(
        fc.property(fc.string(), (str) => {
          const decode = Schema.decodeUnknownEither(VideoCallRoomId)
          const result = decode(str)
          expect(Either.isRight(result)).toBe(true)
          if (Either.isRight(result)) {
            expect(result.right).toBe(str)
          }
        })
      )
    })

    test('property: non-strings fail to decode', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.boolean(), fc.object(), fc.constant(null)),
          (value) => {
            const decode = Schema.decodeUnknownEither(VideoCallRoomId)
            const result = decode(value)
            expect(Either.isLeft(result)).toBe(true)
          }
        )
      )
    })
  })

  describe('VideoCallRoomName', () => {
    test('property: all strings decode successfully', () => {
      fc.assert(
        fc.property(fc.string(), (str) => {
          const decode = Schema.decodeUnknownEither(VideoCallRoomName)
          const result = decode(str)
          expect(Either.isRight(result)).toBe(true)
          if (Either.isRight(result)) {
            expect(result.right).toBe(str)
          }
        })
      )
    })

    test('property: non-strings fail to decode', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.boolean(), fc.object(), fc.constant(null)),
          (value) => {
            const decode = Schema.decodeUnknownEither(VideoCallRoomName)
            const result = decode(value)
            expect(Either.isLeft(result)).toBe(true)
          }
        )
      )
    })
  })

  describe('VideoCallRoom', () => {
    test('property: valid VideoCallRoom structures decode successfully', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          fc.string(),
          fc.webUrl({}),
          (videoCallRoomId, encounterId, externalRoomName, url) => {
            const room = {
              encounterId,
              url,
              videoCallRoomId,
              videoCallRoomName: externalRoomName,
            }
            const decode = Schema.decodeUnknownEither(VideoCallRoom)
            const result = decode(room)
            expect(Either.isRight(result)).toBe(true)
          }
        )
      )
    })

    test('property: missing required fields fail to decode', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string(),
          (videoCallRoomId, encounterId, externalRoomId) => {
            // Missing VideoCallRoomName and url
            const room = {
              VideoCallRoomId: externalRoomId,
              encounterId,
              videoCallRoomId,
            }
            const decode = Schema.decodeUnknownEither(VideoCallRoom)
            const result = decode(room)
            expect(Either.isLeft(result)).toBe(true)
          }
        )
      )
    })

    test('property: encode-decode round trip preserves structure', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.string(),
          fc.string(),
          fc.webUrl(),
          (videoCallRoomId, encounterId, externalRoomId, externalRoomName, url) => {
            const room = {
              VideoCallRoomId: externalRoomId,
              encounterId,
              url,
              videoCallRoomId,
              videoCallRoomName: externalRoomName,
            }
            const decode = Schema.decodeUnknownEither(VideoCallRoom)
            const encode = Schema.encodeUnknownEither(VideoCallRoom)

            const decoded = decode(room)
            if (Either.isRight(decoded)) {
              const encoded = encode(decoded.right)
              expect(Either.isRight(encoded)).toBe(true)
              if (Either.isRight(encoded)) {
                const redecoded = decode(encoded.right)
                expect(Either.isRight(redecoded)).toBe(true)
              }
            }
          }
        )
      )
    })
  })
})
