import { expect, test, describe } from 'vitest'
import { Location } from './Location'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { Code } from '../../data-types'

const locationArb = Arbitrary.make(Location.Schema)

describe('Location resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(locationArb, (location) => {
        const encoded = Schema.encodeSync(Location.Schema)(location)
        const decoded = Schema.decodeSync(Location.Schema)(encoded)
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
