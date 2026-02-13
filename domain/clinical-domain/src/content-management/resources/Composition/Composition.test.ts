import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { DeepReadonly } from '@assessmentis/util'
import { CompositionFromFhirR4 } from './Composition'
import type { Composition as FhirComposition } from 'fhir/r4'

const _compositionEncoded: DeepReadonly<FhirComposition> =
  CompositionFromFhirR4.Encoded

const compositionArb = Arbitrary.make(CompositionFromFhirR4)

describe('Composition', () => {
  it('should encode and decode', () => {
    fc.assert(
      fc.property(compositionArb, (comp) => {
        const encoded = Schema.encodeSync(CompositionFromFhirR4)(comp)
        const decoded = Schema.decodeSync(CompositionFromFhirR4)(encoded)
        expect(decoded).toEqual(comp)
      }),
      { numRuns: 10 }
    )
  })
})
