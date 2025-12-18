import { expect, test, describe } from 'vitest'
import { Reference } from './Reference'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Reference as FhirReference } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _referenceEncoded: DeepReadonly<FhirReference> = Reference.Encoded

const referenceArb = Arbitrary.make(Reference)

describe('Reference model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(referenceArb, (reference) => {
        const encoded = Schema.encodeSync(Reference)(reference)
        const decoded = Schema.decodeSync(Reference)(encoded)
        expect(decoded).toEqual(reference)
      })
    )
  })
})
