import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { Narrative } from './narrative'
import type { NarrativeEncoded } from './narrative'

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
        expect(decoded).toSchemaEqual(narrative)
      })
    )
  })
})
