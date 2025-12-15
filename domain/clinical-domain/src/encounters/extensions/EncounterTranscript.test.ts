import { expect, test, describe } from 'vitest'
import {
  EncounterTranscriptExtension,
  getTranscripts,
  withTranscripts,
  encounterTranscriptUrl,
} from './EncounterTranscript'
import { Schema, Either } from 'effect'
import * as fc from 'fast-check'

describe('EncounterTranscript extension', () => {
  test('property: encode-decode cycle preserves extension structure', () => {
    // Property: For any valid extension, decode(encode(x)) === x
    fc.assert(
      fc.property(fc.webUrl(), (valueUrl) => {
        const encode = Schema.encodeUnknownEither(EncounterTranscriptExtension)
        const decode = Schema.decodeUnknownEither(EncounterTranscriptExtension)

        const extension = {
          url: encounterTranscriptUrl,
          valueUrl,
        }

        const encoded = encode(extension)
        expect(Either.isRight(encoded)).toBe(true)

        if (Either.isRight(encoded)) {
          const decoded = decode(encoded.right)
          expect(Either.isRight(decoded)).toBe(true)
          if (Either.isRight(decoded)) {
            expect(decoded.right.url).toBe(encounterTranscriptUrl)
            expect(decoded.right.valueUrl).toBe(valueUrl)
          }
        }
      })
    )
  })

  test('property: getTranscripts extracts all matching URLs', () => {
    // Property: getTranscripts should extract exactly the URLs with the transcript URL tag
    fc.assert(
      fc.property(
        fc.array(fc.webUrl()),
        fc.array(fc.record({ url: fc.string(), valueUrl: fc.webUrl() })),
        (transcriptUrls, otherExtensions) => {
          const transcriptExtensions = transcriptUrls.map((url) => ({
            url: encounterTranscriptUrl,
            valueUrl: url,
          }))

          const encounter = {
            extension: [
              ...transcriptExtensions,
              ...otherExtensions.filter((ext) => ext.url !== encounterTranscriptUrl),
            ],
          }

          const result = getTranscripts(encounter)
          expect(result).toEqual(transcriptUrls)
          expect(result.length).toBe(transcriptUrls.length)
        }
      )
    )
  })

  test('property: withTranscripts replaces all transcript URLs', () => {
    // Property: withTranscripts should replace all transcript extensions with new ones
    fc.assert(
      fc.property(
        fc.array(fc.webUrl()),
        fc.array(fc.webUrl()),
        fc.array(
          fc.record({
            url: fc.string().filter((s) => s !== encounterTranscriptUrl),
            valueUrl: fc.webUrl(),
          })
        ),
        (oldTranscripts, newTranscripts, otherExtensions) => {
          const oldExtensions = oldTranscripts.map((url) => ({
            url: encounterTranscriptUrl,
            valueUrl: url,
          }))

          const encounter = {
            extension: [...oldExtensions, ...otherExtensions],
          }

          const result = withTranscripts(encounter, newTranscripts)

          // Check that result has exactly the new transcripts
          const resultTranscripts = getTranscripts(result)
          expect(resultTranscripts).toEqual(newTranscripts)

          // Check that other extensions are preserved
          const otherUrls = otherExtensions.map((e) => e.valueUrl)
          const resultOtherExtensions = result.extension.filter(
            (ext) => ext.url !== encounterTranscriptUrl
          )
          expect(resultOtherExtensions.map((e) => e.valueUrl)).toEqual(otherUrls)
        }
      )
    )
  })

  test('property: withTranscripts then getTranscripts is identity', () => {
    // Property: getTranscripts(withTranscripts(encounter, urls)) === urls
    fc.assert(
      fc.property(
        fc.array(fc.record({ url: fc.string(), valueUrl: fc.webUrl() })),
        fc.array(fc.webUrl()),
        (extensions, transcriptUrls) => {
          const encounter = { extension: extensions }
          const result = withTranscripts(encounter, transcriptUrls)
          const extracted = getTranscripts(result)

          expect(extracted).toEqual(transcriptUrls)
        }
      )
    )
  })

  test('property: withTranscripts with empty array removes all transcripts', () => {
    // Property: Setting empty transcripts should remove all transcript extensions
    fc.assert(
      fc.property(
        fc.array(fc.webUrl()),
        fc.array(
          fc.record({
            url: fc.string().filter((s) => s !== encounterTranscriptUrl),
            valueUrl: fc.webUrl(),
          })
        ),
        (transcriptUrls, otherExtensions) => {
          const transcriptExtensions = transcriptUrls.map((url) => ({
            url: encounterTranscriptUrl,
            valueUrl: url,
          }))

          const encounter = {
            extension: [...transcriptExtensions, ...otherExtensions],
          }

          const result = withTranscripts(encounter, [])

          // No transcript extensions should remain
          const transcripts = result.extension.filter(
            (ext) => ext.url === encounterTranscriptUrl
          )
          expect(transcripts).toHaveLength(0)

          // Other extensions should be preserved
          expect(result.extension.length).toBe(otherExtensions.length)
        }
      )
    )
  })
})
