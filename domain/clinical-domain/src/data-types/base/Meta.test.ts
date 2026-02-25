import { expect, test, describe, expectTypeOf } from 'vitest'
import { Meta, type MetaEncoded } from './Meta'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const metaArb = Arbitrary.make(Meta)

describe('DomainResource base model', () => {
  test('should encode to encoded type', () => {
    expectTypeOf<MetaEncoded>().toExtend<typeof Meta.Encoded>()
  })

  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(metaArb, (resource) => {
        const encoded = Schema.encodeSync(Meta)(resource)
        const decoded = Schema.decodeSync(Meta)(encoded)
        expect(decoded).toEqual(resource)
      })
    )
  })
})
