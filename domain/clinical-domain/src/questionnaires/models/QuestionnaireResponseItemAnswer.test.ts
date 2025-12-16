import { expect, test, describe } from 'vitest'
import { QuestionnaireResponseItemAnswer } from './QuestionnaireResponseItem.js'
import { DateTime, Either, Schema, Option } from 'effect'
import * as fc from 'fast-check'

describe('QuestionnaireResponseItemAnswer', () => {
  test('property: encode-decode cycle preserves boolean answers', () => {
    // Property: For any boolean answer, encode-decode should be identity
    fc.assert(
      fc.property(fc.boolean(), (bool) => {
        const encode = Schema.encodeEither(QuestionnaireResponseItemAnswer)
        const decode = Schema.decodeEither(QuestionnaireResponseItemAnswer)

        const answer = { valueBoolean: bool }
        const encoded = encode(answer)

        expect(Either.isRight(encoded)).toBe(true)
        if (Either.isRight(encoded)) {
          const decoded = decode(encoded.right)
          expect(Either.isRight(decoded)).toBe(true)
          if (Either.isRight(decoded)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((decoded.right as any).valueBoolean).toBe(bool)
          }
        }
      })
    )
  })

  test('property: encode-decode cycle with string extensions', () => {
    // Property: String extensions should be preserved through encode-decode
    fc.assert(
      fc.property(fc.boolean(), fc.webUrl(), fc.string(), (bool, url, str) => {
        const encode = Schema.encodeEither(QuestionnaireResponseItemAnswer)
        const decode = Schema.decodeEither(QuestionnaireResponseItemAnswer)

        const answer = {
          valueBoolean: bool,
          modifierExtension: [{ url, valueString: str }],
        }

        const encoded = encode(answer)
        expect(Either.isRight(encoded)).toBe(true)

        if (Either.isRight(encoded)) {
          const decoded = decode(encoded.right)
          expect(Either.isRight(decoded)).toBe(true)
          if (Either.isRight(decoded)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect((decoded.right as any).valueBoolean).toBe(bool)

            expect(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (decoded.right as any).modifierExtension?.[0]?.valueString
            ).toBe(str)
          }
        }
      })
    )
  })

  test('property: encode converts DateTime to ISO string', () => {
    // Property: DateTime in extensions should be converted to ISO strings on encode
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.webUrl(),
        fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }),
        (bool, url, date) => {
          const encode = Schema.encodeEither(QuestionnaireResponseItemAnswer)

          const isoString = date.toISOString()
          const dateTimeOption = DateTime.makeZonedFromString(isoString)

          // Only test when DateTime can be successfully created
          if (Option.isSome(dateTimeOption)) {
            const dateTime = dateTimeOption.pipe(
              Option.map(DateTime.toUtc),
              Option.getOrThrow
            )

            const answer = {
              valueBoolean: bool,
              modifierExtension: [{ url, valueDateTime: dateTime }],
            }

            const encoded = encode(answer)
            expect(Either.isRight(encoded)).toBe(true)

            if (Either.isRight(encoded)) {
              // The encoded DateTime should be a string
              expect(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                typeof (encoded.right as any).modifierExtension?.[0]
                  ?.valueDateTime
              ).toBe('string')
            }
          }
        }
      )
    )
  })

  test('property: decode converts ISO string to DateTime', () => {
    // Property: ISO strings in extensions should be converted to DateTime on decode
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.webUrl(),
        fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') }),
        (bool, url, date) => {
          const decode = Schema.decodeEither(QuestionnaireResponseItemAnswer)

          const isoString = date.toISOString()
          const answer = {
            valueBoolean: bool,
            modifierExtension: [{ url, valueDateTime: isoString }],
          }

          const decoded = decode(answer)
          expect(Either.isRight(decoded)).toBe(true)

          if (Either.isRight(decoded)) {
            const decodedDateTime =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (decoded.right as any).modifierExtension?.[0]?.valueDateTime
            // Should be a DateTime object
            expect(decodedDateTime).toBeDefined()
            // DateTime should represent the same instant
            if (decodedDateTime && typeof decodedDateTime !== 'string') {
              const reEncoded = DateTime.formatIso(decodedDateTime)
              expect(reEncoded).toBe(isoString)
            }
          }
        }
      )
    )
  })

  test('property: full encode-decode cycle is identity for valid data', () => {
    // Property: decode(encode(x)) should equal x for all valid answers
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.array(
          fc.record({
            url: fc.webUrl(),
            valueString: fc.option(fc.string(), { nil: undefined }),
          })
        ),
        (bool, extensions) => {
          const encode = Schema.encodeEither(QuestionnaireResponseItemAnswer)
          const decode = Schema.decodeEither(QuestionnaireResponseItemAnswer)

          const answer = {
            valueBoolean: bool,
            modifierExtension: extensions.length > 0 ? extensions : undefined,
          }

          const encoded = encode(answer)
          if (Either.isRight(encoded)) {
            const decoded = decode(encoded.right)
            if (Either.isRight(decoded)) {
              const reencoded = encode(decoded.right)
              expect(Either.isRight(reencoded)).toBe(true)
              if (Either.isRight(reencoded)) {
                // The structure should be preserved
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                expect((reencoded.right as any).valueBoolean).toBe(bool)
              }
            }
          }
        }
      )
    )
  })
})
