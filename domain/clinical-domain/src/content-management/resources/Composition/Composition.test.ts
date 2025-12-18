import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { DeepReadonly } from '@assessmentis/util'
import { Composition } from './Composition'
import { Composition as FhirComposition } from 'fhir/r4'

const _compositionEncoded: DeepReadonly<FhirComposition> = Composition.Encoded

const compositionArb = Arbitrary.make(Composition)

describe('Composition', () => {
  it('should encode and decode', () => {
    fc.assert(
      fc.property(compositionArb, (comp) => {
        const encoded = Schema.encodeSync(Composition)(comp)
        const decoded = Schema.decodeSync(Composition)(encoded)
        expect(decoded).toEqual(comp)
      }),
      { numRuns: 10 }
    )
  })
})
