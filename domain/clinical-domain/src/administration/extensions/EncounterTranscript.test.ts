import { expect, test, describe } from 'vitest'
import {
  EncounterTranscriptExtension,
  getTranscripts,
  withTranscripts,
} from './EncounterTranscript'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Extension as FhirExtension } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4 Extension
const _encounterTranscriptEncoded: DeepReadonly<FhirExtension> =
  EncounterTranscriptExtension.Encoded

const transcriptExtensionArb = Arbitrary.make(EncounterTranscriptExtension)

describe('EncounterTranscript extension', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(transcriptExtensionArb, (extension) => {
        const encoded = Schema.encodeSync(EncounterTranscriptExtension)(
          extension
        )
        const decoded = Schema.decodeSync(EncounterTranscriptExtension)(encoded)
        expect(decoded).toEqual(extension)
      })
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
})
