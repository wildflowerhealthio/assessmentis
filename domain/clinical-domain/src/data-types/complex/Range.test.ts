import { expect, test, describe } from 'vitest'
import { Range } from './Range'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Range as FhirRange } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _rangeEncoded: DeepReadonly<FhirRange> = Range.Encoded

const rangeArb = Arbitrary.make(Range)

describe('Range model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(rangeArb, (range) => {
        const encoded = Schema.encodeSync(Range)(range)
        const decoded = Schema.decodeSync(Range)(encoded)
        expect(decoded).toEqual(range)
      })
    )
  })
})
