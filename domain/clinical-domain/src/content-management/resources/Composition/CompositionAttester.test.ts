import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { DeepReadonly } from '@assessmentis/util'
import { CompositionAttesterFromFhirR4 } from './CompositionAttester'
import type { CompositionAttester as FhirCompositionAttester } from 'fhir/r4'

const _compositionAttesterEncoded: DeepReadonly<FhirCompositionAttester> =
  CompositionAttesterFromFhirR4.Encoded

const attesterArb = Arbitrary.make(CompositionAttesterFromFhirR4)

describe('CompositionAttester', () => {
  it('should encode and decode', () => {
    fc.assert(
      fc.property(attesterArb, (attester) => {
        const encoded = Schema.encodeSync(CompositionAttesterFromFhirR4)(
          attester
        )
        const decoded = Schema.decodeSync(CompositionAttesterFromFhirR4)(
          encoded
        )
        expect(decoded).toEqual(attester)
      }),
      { numRuns: 10 }
    )
  })
})
