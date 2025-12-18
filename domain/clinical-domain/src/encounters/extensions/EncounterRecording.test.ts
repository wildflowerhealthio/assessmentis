import { expect, test, describe } from 'vitest'
import {
  EncounterRecordingFileExtension,
  getRecordingFileUrls,
  withRecordingFileUrls,
  encounterRecordingFileUrl,
} from './EncounterRecording'
import { Schema, Either } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Extension as FhirExtension } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4 Extension
const _encounterRecordingEncoded: DeepReadonly<FhirExtension> =
  EncounterRecordingFileExtension.Encoded

describe('EncounterRecording extension', () => {
  test('property: encode-decode cycle preserves extension structure', () => {
    // Property: For any valid extension, decode(encode(x)) === x
    fc.assert(
      fc.property(fc.webUrl(), (valueUrl) => {
        const encode = Schema.encodeUnknownEither(
          EncounterRecordingFileExtension
        )
        const decode = Schema.decodeUnknownEither(
          EncounterRecordingFileExtension
        )

        const extension = {
          url: encounterRecordingFileUrl,
          valueUrl,
        }

        const encoded = encode(extension)
        expect(Either.isRight(encoded)).toBe(true)

        if (Either.isRight(encoded)) {
          const decoded = decode(encoded.right)
          expect(Either.isRight(decoded)).toBe(true)
          if (Either.isRight(decoded)) {
            expect(decoded.right.url).toBe(encounterRecordingFileUrl)
            expect(decoded.right.valueUrl).toBe(valueUrl)
          }
        }
      })
    )
  })

  test('property: getRecordingFileUrls extracts all matching URLs', () => {
    // Property: getRecordingFileUrls should extract exactly the URLs with the recording URL tag
    fc.assert(
      fc.property(
        fc.array(fc.webUrl()),
        fc.array(fc.record({ url: fc.string(), valueUrl: fc.webUrl() })),
        (recordingUrls, otherExtensions) => {
          const recordingExtensions = recordingUrls.map((url) => ({
            url: encounterRecordingFileUrl,
            valueUrl: url,
          }))

          const encounter = {
            extension: [
              ...recordingExtensions,
              ...otherExtensions.filter(
                (ext) => ext.url !== encounterRecordingFileUrl
              ),
            ],
          }

          const result = getRecordingFileUrls(encounter)
          expect(result).toEqual(recordingUrls)
          expect(result.length).toBe(recordingUrls.length)
        }
      )
    )
  })

  test('property: withRecordingFileUrls replaces all recording URLs', () => {
    // Property: withRecordingFileUrls should replace all recording extensions with new ones
    fc.assert(
      fc.property(
        fc.array(fc.webUrl()),
        fc.array(fc.webUrl()),
        fc.array(
          fc.record({
            url: fc.string().filter((s) => s !== encounterRecordingFileUrl),
            valueUrl: fc.webUrl(),
          })
        ),
        (oldRecordings, newRecordings, otherExtensions) => {
          const oldExtensions = oldRecordings.map((url) => ({
            url: encounterRecordingFileUrl,
            valueUrl: url,
          }))

          const encounter = {
            extension: [...oldExtensions, ...otherExtensions],
          }

          const result = withRecordingFileUrls(encounter, newRecordings)

          // Check that result has exactly the new recordings
          const resultRecordings = getRecordingFileUrls(result)
          expect(resultRecordings).toEqual(newRecordings)

          // Check that other extensions are preserved
          const otherUrls = otherExtensions.map((e) => e.valueUrl)
          const resultOtherExtensions = result.extension.filter(
            (ext) => ext.url !== encounterRecordingFileUrl
          )
          expect(resultOtherExtensions.map((e) => e.valueUrl)).toEqual(
            otherUrls
          )
        }
      )
    )
  })

  test('property: withRecordingFileUrls then getRecordingFileUrls is identity', () => {
    // Property: getRecordingFileUrls(withRecordingFileUrls(encounter, urls)) === urls
    fc.assert(
      fc.property(
        fc.array(fc.record({ url: fc.string(), valueUrl: fc.webUrl() })),
        fc.array(fc.webUrl()),
        (extensions, recordingUrls) => {
          const encounter = { extension: extensions }
          const result = withRecordingFileUrls(encounter, recordingUrls)
          const extracted = getRecordingFileUrls(result)

          expect(extracted).toEqual(recordingUrls)
        }
      )
    )
  })

  test('property: withRecordingFileUrls with empty array removes all recordings', () => {
    // Property: Setting empty recordings should remove all recording extensions
    fc.assert(
      fc.property(
        fc.array(fc.webUrl()),
        fc.array(
          fc.record({
            url: fc.string().filter((s) => s !== encounterRecordingFileUrl),
            valueUrl: fc.webUrl(),
          })
        ),
        (recordingUrls, otherExtensions) => {
          const recordingExtensions = recordingUrls.map((url) => ({
            url: encounterRecordingFileUrl,
            valueUrl: url,
          }))

          const encounter = {
            extension: [...recordingExtensions, ...otherExtensions],
          }

          const result = withRecordingFileUrls(encounter, [])

          // No recording extensions should remain
          const recordings = result.extension.filter(
            (ext) => ext.url === encounterRecordingFileUrl
          )
          expect(recordings).toHaveLength(0)

          // Other extensions should be preserved
          expect(result.extension.length).toBe(otherExtensions.length)
        }
      )
    )
  })
})
