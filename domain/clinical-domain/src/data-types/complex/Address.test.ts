import { expect, test, describe } from 'vitest'
import { Address } from './Address'
import { DeepReadonly } from '@assessmentis/util'
import { Address as FhirAddress } from 'fhir/r4'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

// Compile-time check that Encoded schema matches FHIR R4
const _addressEncoded: DeepReadonly<FhirAddress> = Address.Encoded

const addressArb = Arbitrary.make(Address)

describe('Address model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(addressArb, (address) => {
        const encoded = Schema.encodeSync(Address)(address)
        const decoded = Schema.decodeSync(Address)(encoded)
        expect(decoded).toEqual(address)
      })
    )
  })
})
