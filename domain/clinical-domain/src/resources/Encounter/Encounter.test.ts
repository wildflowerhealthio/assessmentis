import { expect, test, describe } from 'vitest'
import * as Encounter from './Encounter'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const encounterArb = Arbitrary.make(Encounter.Encounter)

describe('Encounter resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(encounterArb, (encounter) => {
        const encoded = Schema.encodeSync(Encounter.Encounter)(encounter)
        const decoded = Schema.decodeSync(Encounter.Encounter)(encoded)
        expect(decoded).toEqual(encounter)
      })
    )
  })
})
