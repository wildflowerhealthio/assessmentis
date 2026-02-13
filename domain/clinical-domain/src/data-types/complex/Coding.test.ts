import { expect, test, describe } from 'vitest'
import { Coding } from './Coding'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Coding as FhirCoding } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _codingEncoded: DeepReadonly<FhirCoding> = Coding.Encoded

const codingArb = Arbitrary.make(Coding)

describe('Coding model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(codingArb, (coding) => {
        const encoded = Schema.encodeSync(Coding)(coding)
        const decoded = Schema.decodeSync(Coding)(encoded)
        expect(decoded).toEqual(coding)
      })
    )
  })
})
