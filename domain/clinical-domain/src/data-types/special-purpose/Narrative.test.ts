import { expect, test, describe, expectTypeOf } from 'vitest'
import { Narrative, type NarrativeEncoded } from './Narrative'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const narrativeArb = Arbitrary.make(Narrative)

describe('Narrative model', () => {
  test('should encode to encoded type', () => {
    expectTypeOf<typeof Narrative.Encoded>().toExtend<NarrativeEncoded>()
  })
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(narrativeArb, (narrative) => {
        const encoded = Schema.encodeSync(Narrative)(narrative)
        const decoded = Schema.decodeSync(Narrative)(encoded)
        expect(decoded).toEqual(narrative)
      })
    )
  })
})
