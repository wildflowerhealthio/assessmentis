import { expect, test, describe } from 'vitest'
import { ContactPoint } from './ContactPoint'
import { DeepReadonly } from '@assessmentis/util'
import { ContactPoint as FhirContactPoint } from 'fhir/r4'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

// Compile-time check that Encoded schema matches FHIR R4
const _contactPointEncoded: DeepReadonly<FhirContactPoint> =
  ContactPoint.Encoded

const contactPointArb = Arbitrary.make(ContactPoint)

describe('ContactPoint model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(contactPointArb, (contactPoint) => {
        const encoded = Schema.encodeSync(ContactPoint)(contactPoint)
        const decoded = Schema.decodeSync(ContactPoint)(encoded)
        expect(decoded).toEqual(contactPoint)
      })
    )
  })
})
