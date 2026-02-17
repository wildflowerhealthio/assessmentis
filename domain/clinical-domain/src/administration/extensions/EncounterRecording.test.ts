import { expect, test, describe } from 'vitest'
import {
  EncounterRecordingFileExtension,
  getRecordingFileUrls,
  withRecordingFileUrls,
} from './EncounterRecording'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

const recordingExtensionArb = Arbitrary.make(EncounterRecordingFileExtension)

describe('EncounterRecording extension', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(recordingExtensionArb, (extension) => {
        const encoded = Schema.encodeSync(EncounterRecordingFileExtension)(
          extension
        )
        const decoded = Schema.decodeSync(EncounterRecordingFileExtension)(
          encoded
        )
        expect(decoded).toEqual(extension)
      })
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
})
