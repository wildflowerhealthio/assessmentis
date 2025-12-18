import { Arbitrary } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { DeepReadonly } from '@assessmentis/util'
import { CompositionAttester } from './CompositionAttester'
import { CompositionAttester as FhirCompositionAttester } from 'fhir/r4'

const _compositionAttesterEncoded: DeepReadonly<FhirCompositionAttester> =
  CompositionAttester.Encoded

const attesterArb = Arbitrary.make(CompositionAttester)

describe('CompositionAttester', () => {
  it('should encode and decode', () => {
    fc.assert(
      fc.property(attesterArb, (attester) => {
        const result = CompositionAttester.make(attester)
        expect(result.mode).toBeDefined()
      }),
      { numRuns: 10 }
    )
  })
})
