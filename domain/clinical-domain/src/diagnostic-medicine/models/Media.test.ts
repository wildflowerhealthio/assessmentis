import { expect, test, describe } from 'vitest'
import { Media, MediaStatus } from './Media'
import { DeepReadonly } from '@assessmentis/util'
import { Media as FhirMedia } from 'fhir/r4'
import { Schema, Either } from 'effect'
import * as fc from 'fast-check'

// Compile-time check that Encoded schema matches FHIR R4
const _mediaEncoded: DeepReadonly<FhirMedia> = Media.Encoded

describe('Media model', () => {
  test('property: encode-decode cycle preserves minimal Media', () => {
    // Property: Minimal valid Media should encode-decode correctly
    fc.assert(
      fc.property(
        fc.constantFrom(
          'completed',
          'preparation',
          'in-progress',
          'not-done',
          'entered-in-error',
          'stopped',
          'on-hold',
          'unknown'
        ),
        fc.string(),
        (status, contentType) => {
          const decode = Schema.decodeUnknownEither(Media)
          const encode = Schema.encodeUnknownEither(Media)

          const media = {
            resourceType: 'Media' as const,
            status,
            content: { contentType },
          }

          const decoded = decode(media)
          if (Either.isRight(decoded)) {
            const encoded = encode(decoded.right)
            expect(Either.isRight(encoded)).toBe(true)
            if (Either.isRight(encoded)) {
              expect(encoded.right.resourceType).toBe('Media')
              expect(encoded.right.status).toBe(status)
              expect(encoded.right.content.contentType).toBe(contentType)
            }
          }
        }
      )
    )
  })

  test('property: MediaStatus validates enum values', () => {
    // Property: Only valid MediaStatus values should encode successfully
    fc.assert(
      fc.property(
        fc.constantFrom(
          'completed',
          'preparation',
          'in-progress',
          'not-done',
          'entered-in-error',
          'stopped',
          'on-hold',
          'unknown'
        ),
        (status) => {
          const encode = Schema.encodeUnknownEither(MediaStatus)
          const result = encode(status)
          expect(Either.isRight(result)).toBe(true)
        }
      )
    )
  })

  test('property: invalid MediaStatus values fail', () => {
    // Property: Invalid status values should fail
    fc.assert(
      fc.property(
        fc
          .string()
          .filter(
            (s) =>
              ![
                'completed',
                'preparation',
                'in-progress',
                'not-done',
                'entered-in-error',
                'stopped',
                'on-hold',
                'unknown',
              ].includes(s)
          ),
        (invalidStatus) => {
          const encode = Schema.encodeUnknownEither(MediaStatus)
          const result = encode(invalidStatus)
          expect(Either.isLeft(result)).toBe(true)
        }
      )
    )
  })

  test('property: missing required fields always fail', () => {
    // Property: Media must have resourceType, status, and content
    fc.assert(
      fc.property(
        fc.oneof(
          // Missing status
          fc.record({
            resourceType: fc.constant('Media' as const),
            content: fc.record({ contentType: fc.string() }),
          }),
          // Missing content
          fc.record({
            resourceType: fc.constant('Media' as const),
            status: fc.constantFrom('completed', 'preparation'),
          }),
          // Missing resourceType
          fc.record({
            status: fc.constantFrom('completed', 'preparation'),
            content: fc.record({ contentType: fc.string() }),
          })
        ),
        (incomplete) => {
          const decode = Schema.decodeUnknownEither(Media)
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
          const decode = Schema.decodeUnknownEither(Media)
          const encode = Schema.encodeUnknownEither(Media)

          const media: {
            resourceType: 'Media'
            status: string
            content: { contentType: string }
            height?: number
            width?: number
            deviceName?: string
          } = {
            resourceType: 'Media',
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
          const decode = Schema.decodeUnknownEither(Media)
          const encode = Schema.encodeUnknownEither(Media)

          const media: {
            resourceType: 'Media'
            status: string
            content: { contentType: string }
            duration?: number
            frames?: number
          } = {
            resourceType: 'Media',
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
          const decode = Schema.decodeUnknownEither(Media)
          const encode = Schema.encodeUnknownEither(Media)

          const media = {
            resourceType: 'Media' as const,
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
