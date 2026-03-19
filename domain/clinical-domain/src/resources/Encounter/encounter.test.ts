import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { Encounter } from './encounter'

const encounterArb = Arbitrary.make(Encounter)

describe('Encounter resource', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(encounterArb, (encounter) => {
        const encoded = Schema.encodeSync(Encounter)(encounter)
        const decoded = Schema.decodeSync(Encounter)(encoded)
        expect(decoded).toSchemaEqual(encounter)
      })
    )
  })
})
