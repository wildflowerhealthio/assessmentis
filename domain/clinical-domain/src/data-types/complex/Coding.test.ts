import { expect, test, describe } from 'vitest'
import * as Coding from './Coding'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

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
