import { expect, test, describe } from 'vitest'
import { Location, LocationFromFhirR4 } from './Location'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Location as FhirLocation } from 'fhir/r4'
import { Code } from '../../data-types'

// Compile-time check that Encoded schema matches FHIR R4
const _locationEncoded: DeepReadonly<FhirLocation> = LocationFromFhirR4.Encoded

const locationArb = Arbitrary.make(LocationFromFhirR4)

describe('Location resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(locationArb, (location) => {
        const encoded = Schema.encodeSync(LocationFromFhirR4)(location)
        const decoded = Schema.decodeSync(LocationFromFhirR4)(encoded)
        expect(decoded).toEqual(location)
      })
    )
  })

  describe('Location.isVirtualLocation', () => {
    test('returns true for location with virtual physical type code', () => {
      const virtualLocation = {
        physicalType: {
          coding: [{ code: Code.make('vi') }],
        },
      }
      expect(Location.isVirtualLocation(virtualLocation)).toBe(true)
    })

    test('returns false for location without virtual physical type code', () => {
      const physicalLocation = {
        physicalType: {
          coding: [{ code: Code.make('ro') }],
        },
      }
      expect(Location.isVirtualLocation(physicalLocation)).toBe(false)
    })

    test('returns false for location without physicalType', () => {
      const location = {}
      expect(Location.isVirtualLocation(location)).toBe(false)
    })

    test('returns false for location with empty coding array', () => {
      const location = {
        physicalType: {
          coding: [],
        },
      }
      expect(Location.isVirtualLocation(location)).toBe(false)
    })

    test('returns true if any coding has virtual code', () => {
      const location = {
        physicalType: {
          coding: [{ code: Code.make('ro') }, { code: Code.make('vi') }],
        },
      }
      expect(Location.isVirtualLocation(location)).toBe(true)
    })
  })
})
