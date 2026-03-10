import * as fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import * as Coding from './Coding'

const codingArb = Arbitrary.make(Coding.Coding)

describe('Coding model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(codingArb, (coding) => {
        const encoded = Schema.encodeSync(Coding.Coding)(coding)
        const decoded = Schema.decodeSync(Coding.Coding)(encoded)
        expect(decoded).toEqual(coding)
      })
    )
  })
})
