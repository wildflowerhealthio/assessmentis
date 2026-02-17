import { expect, test, describe } from 'vitest'
import { Extension } from './Extension'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const extensionArb = Arbitrary.make(Extension.Schema)

describe('Extension model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(extensionArb, (extension) => {
        const encoded = Schema.encodeSync(Extension.Schema)(extension)
        const decoded = Schema.decodeSync(Extension.Schema)(encoded)
        expect(decoded).toEqual(decoded)
      })
    )
  })
})
