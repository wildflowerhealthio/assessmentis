import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import * as HumanName from './HumanName'

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
