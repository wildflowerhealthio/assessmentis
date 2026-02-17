import { expect, test, describe } from 'vitest'
import { Resource } from './Resource'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const TestResource = Resource.Schema(Schema.String)

const resourceArb = Arbitrary.make(TestResource)

describe('Resource base model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(resourceArb, (resource) => {
        const encoded = Schema.encodeSync(TestResource)(resource)
        const decoded = Schema.decodeSync(TestResource)(encoded)
        expect(decoded).toEqual(resource)
      })
    )
  })
})
