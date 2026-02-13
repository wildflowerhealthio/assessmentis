import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { DeepReadonly } from '@assessmentis/util'
import { CompositionAttester } from './CompositionAttester'
import type { CompositionAttester as FhirCompositionAttester } from 'fhir/r4'

const _compositionAttesterEncoded: DeepReadonly<FhirCompositionAttester> =
  CompositionAttester.Encoded

const attesterArb = Arbitrary.make(CompositionAttester)

describe('CompositionAttester', () => {
  it('should encode and decode', () => {
    fc.assert(
      fc.property(attesterArb, (attester) => {
        const encoded = Schema.encodeSync(CompositionAttester)(attester)
        const decoded = Schema.decodeSync(CompositionAttester)(encoded)
        expect(decoded).toEqual(attester)
      }),
      { numRuns: 10 }
    )
  })
})
