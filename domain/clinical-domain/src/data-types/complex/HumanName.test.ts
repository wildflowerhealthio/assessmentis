import { expect, test, describe } from 'vitest'
import { HumanName } from './HumanName'
import { Schema, Arbitrary } from 'effect'
import * as fc from 'fast-check'

const humanNameArb = Arbitrary.make(HumanName.Schema)

describe('HumanName model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(humanNameArb, (humanName) => {
        const encoded = Schema.encodeSync(HumanName.Schema)(humanName)
        const decoded = Schema.decodeSync(HumanName.Schema)(encoded)
        expect(decoded).toEqual(humanName)
      })
    )
  })
})
