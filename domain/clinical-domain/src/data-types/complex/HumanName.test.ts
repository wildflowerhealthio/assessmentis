import { expect, test, describe } from 'vitest'
import * as HumanName from './HumanName'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

const humanNameArb = Arbitrary.make(HumanName.HumanName)

describe('HumanName model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(humanNameArb, (humanName) => {
        const encoded = Schema.encodeSync(HumanName.HumanName)(humanName)
        const decoded = Schema.decodeSync(HumanName.HumanName)(encoded)
        expect(decoded).toEqual(humanName)
      })
    )
  })
})
