import { expect, test, describe } from 'vitest'
import { Coding } from './Coding'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const codingArb = Arbitrary.make(Coding.Schema)

describe('Coding model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(codingArb, (coding) => {
        const encoded = Schema.encodeSync(Coding.Schema)(coding)
        const decoded = Schema.decodeSync(Coding.Schema)(encoded)
        expect(decoded).toEqual(coding)
      })
    )
  })
})
