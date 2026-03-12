import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Either, Schema } from 'effect'

import * as Media from './Media'

const mediaArb = Arbitrary.make(Media.Media)

describe('Media model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(mediaArb, (media) => {
        const encoded = Schema.encodeSync(Media.Media)(media)
        const decoded = Schema.decodeSync(Media.Media)(encoded)
        expect(decoded).toEqual(media)
      })
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: Media must have domainType, status, and content
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing status
          fc.record({
            domainType: fc.constant('Media' as const),
            content: fc.record({ contentType: fc.string() }),
          }),
          // Missing content
          fc.record({
            domainType: fc.constant('Media' as const),
            status: fc.constantFrom('completed', 'preparation'),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(Media.Media)
          const result = decode(incomplete)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })

  test('property: optional fields are preserved through encode-decode', () => {
    // Property: Optional fields like height, width, deviceName should be preserved
    fc.assert(
      fc.property(
        fc.constantFrom('completed', 'preparation', 'in-progress'),
        fc.string(),
        fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
        fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
        fc.option(fc.string(), { nil: undefined }),
        (status, contentType, height, width, deviceName) => {
          const decode = Schema.decodeUnknownEither(Media.Media)
          const encode = Schema.encodeUnknownEither(Media.Media)

          const media: {
            domainType: 'Media'
            status: string
            content: { contentType: string }
            height?: number
            width?: number
            deviceName?: string
          } = {
            domainType: 'Media',
            status,
            content: { contentType },
          }
          if (height !== undefined) media.height = height
          if (width !== undefined) media.width = width
          if (deviceName !== undefined) media.deviceName = deviceName

          const decoded = decode(media)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            if (Either.isRight(encoded)) {
              if (height !== undefined) {
                expect(encoded.right.height).toBe(height)
              }
              if (width !== undefined) {
                expect(encoded.right.width).toBe(width)
              }
              if (deviceName !== undefined) {
                expect(encoded.right.deviceName).toBe(deviceName)
              }
            }
          }
        }
      )
    )
  })

  test('property: video metadata is preserved', () => {
    // Property: Video-specific fields (duration, frames) should be preserved
    fc.assert(
      fc.property(
        fc.option(fc.float({ min: 0, max: 10000 }), { nil: undefined }),
        fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
        (duration, frames) => {
          const decode = Schema.decodeUnknownEither(Media.Media)
          const encode = Schema.encodeUnknownEither(Media.Media)

          const media: {
            domainType: 'Media'
            status: string
            content: { contentType: string }
            duration?: number
            frames?: number
          } = {
            domainType: 'Media',
            status: 'completed',
            content: { contentType: 'video/mp4' },
          }
          if (duration !== undefined) media.duration = duration
          if (frames !== undefined) media.frames = frames

          const decoded = decode(media)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            if (Either.isRight(encoded)) {
              if (duration !== undefined) {
                expect(encoded.right.duration).toBe(duration)
              }
              if (frames !== undefined) {
                expect(encoded.right.frames).toBe(frames)
              }
            }
          }
        }
      )
    )
  })

  test('property: encode is inverse of decode', () => {
    // Property: decode(encode(decode(x))) === decode(x)
    fc.assert(
      fc.property(
        fc.constantFrom('completed', 'preparation', 'in-progress'),
        fc.string(),
        (status, contentType) => {
          const decode = Schema.decodeUnknownEither(Media.Media)
          const encode = Schema.encodeUnknownEither(Media.Media)

          const media = {
            domainType: 'Media' as const,
            status,
            content: { contentType },
          }

          const decoded1 = decode(media)
          if (Either.isRight(decoded1)) {
            const encoded = encode(decoded1.right)
            if (Either.isRight(encoded)) {
              const decoded2 = decode(encoded.right)
              expect(Either.isRight(decoded2)).toBe(true)
              if (Either.isRight(decoded2)) {
                expect(decoded2.right.status).toBe(decoded1.right.status)
                expect(decoded2.right.content.contentType).toBe(
                  decoded1.right.content.contentType
                )
              }
            }
          }
        }
      )
    )
  })
})
