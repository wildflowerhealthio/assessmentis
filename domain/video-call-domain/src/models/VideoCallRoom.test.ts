import { expect, test, describe } from 'vitest'
import { Schema, Either } from 'effect'
import * as fc from 'fast-check'
import {
  VideoCallRoomId,
  ExternalVideoCallRoomId,
  ExternalVideoCallRoomName,
  VideoCallRoom,
} from './VideoCallRoom'

describe('VideoCallRoom Models', () => {
  describe('VideoCallRoomId', () => {
    test('property: valid UUIDs decode successfully', () => {
      fc.assert(
        fc.property(fc.uuid(), (uuid) => {
          const decode = Schema.decodeUnknownEither(VideoCallRoomId)
          const result = decode(uuid)
          expect(Either.isRight(result)).toBe(true)
          if (Either.isRight(result)) {
            expect(result.right).toBe(uuid)
          }
        })
      )
    })

    test('property: invalid UUIDs fail to decode', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string().filter((s) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)),
            fc.integer(),
            fc.boolean()
          ),
          (value) => {
            const decode = Schema.decodeUnknownEither(VideoCallRoomId)
            const result = decode(value)
            expect(Either.isLeft(result)).toBe(true)
          }
        )
      )
    })

    test('property: encode is inverse of decode', () => {
      fc.assert(
        fc.property(fc.uuid(), (uuid) => {
          const decode = Schema.decodeUnknownEither(VideoCallRoomId)
          const encode = Schema.encodeUnknownEither(VideoCallRoomId)

          const decoded = decode(uuid)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            expect(Either.isRight(encoded)).toBe(true)
            if (Either.isRight(encoded)) {
              expect(encoded.right).toBe(uuid)
            }
          }
        })
      )
    })
  })

  describe('ExternalVideoCallRoomId', () => {
    test('property: all strings decode successfully', () => {
      fc.assert(
        fc.property(fc.string(), (str) => {
          const decode = Schema.decodeUnknownEither(ExternalVideoCallRoomId)
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
            const decode = Schema.decodeUnknownEither(ExternalVideoCallRoomId)
            const result = decode(value)
            expect(Either.isLeft(result)).toBe(true)
          }
        )
      )
    })
  })

  describe('ExternalVideoCallRoomName', () => {
    test('property: all strings decode successfully', () => {
      fc.assert(
        fc.property(fc.string(), (str) => {
          const decode = Schema.decodeUnknownEither(ExternalVideoCallRoomName)
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
            const decode = Schema.decodeUnknownEither(ExternalVideoCallRoomName)
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
          fc.uuid(),
          fc.uuid(),
          fc.string(),
          fc.string(),
          fc.webUrl(),
          (videoCallRoomId, encounterId, externalRoomId, externalRoomName, url) => {
            const room = {
              videoCallRoomId,
              encounterId,
              externalVideoCallRoomId: externalRoomId,
              externalVideoCallRoomName: externalRoomName,
              url,
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
            // Missing externalVideoCallRoomName and url
            const room = {
              videoCallRoomId,
              encounterId,
              externalVideoCallRoomId: externalRoomId,
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
              videoCallRoomId,
              encounterId,
              externalVideoCallRoomId: externalRoomId,
              externalVideoCallRoomName: externalRoomName,
              url,
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
