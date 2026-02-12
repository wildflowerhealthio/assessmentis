import { expect, test, describe } from 'vitest'
import { Location, isVirtualLocation } from './Location'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import type { DeepReadonly } from '@assessmentis/util'
import type { Location as FhirLocation } from 'fhir/r4'
import { Code } from '../../data-types'

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

  describe('isVirtualLocation', () => {
    test('returns true for location with virtual physical type code', () => {
      const virtualLocation = {
        physicalType: {
          coding: [{ code: Code.make('vi') }],
        },
      }
      expect(isVirtualLocation(virtualLocation)).toBe(true)
    })

    test('returns false for location without virtual physical type code', () => {
      const physicalLocation = {
        physicalType: {
          coding: [{ code: Code.make('ro') }],
        },
      }
      expect(isVirtualLocation(physicalLocation)).toBe(false)
    })

    test('returns false for location without physicalType', () => {
      const location = {}
      expect(isVirtualLocation(location)).toBe(false)
    })

    test('returns false for location with empty coding array', () => {
      const location = {
        physicalType: {
          coding: [],
        },
      }
      expect(isVirtualLocation(location)).toBe(false)
    })

    test('returns true if any coding has virtual code', () => {
      const location = {
        physicalType: {
          coding: [{ code: Code.make('ro') }, { code: Code.make('vi') }],
        },
      }
      expect(isVirtualLocation(location)).toBe(true)
    })
  })
})
