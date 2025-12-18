import { expect, test, describe } from 'vitest'
import { Location } from './Location'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { DeepReadonly } from '@assessmentis/util'
import { Location as FhirLocation } from 'fhir/r4'

// Compile-time check that Encoded schema matches FHIR R4
const _locationEncoded: DeepReadonly<FhirLocation> = Location.Encoded

const locationArb = Arbitrary.make(Location)

describe('Location resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(locationArb, (location) => {
        const encoded = Schema.encodeSync(Location)(location)
        const decoded = Schema.decodeSync(Location)(encoded)
        expect(decoded).toEqual(location)
      })
    )
  })
})
