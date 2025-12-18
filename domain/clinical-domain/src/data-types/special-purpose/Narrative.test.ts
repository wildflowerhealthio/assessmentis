import { expect, test, describe } from 'vitest'
import { Narrative } from './Narrative'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Narrative as FhirNarrative } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _narrativeEncoded: DeepReadonly<FhirNarrative> = Narrative.Encoded

const narrativeArb = Arbitrary.make(Narrative)

describe('Narrative model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(narrativeArb, (narrative) => {
        const encoded = Schema.encodeSync(Narrative)(narrative)
        const decoded = Schema.decodeSync(Narrative)(encoded)
        expect(decoded).toEqual(narrative)
      })
    )
  })
})
