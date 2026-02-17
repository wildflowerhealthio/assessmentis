import { expect, test, describe } from 'vitest'
import { DomainResource } from './DomainResource'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'

const TestDomainResource = Schema.extend(
  DomainResource.Schema(Schema.String),
  Schema.Struct({
    resourceType: Schema.Literal('Basic'),
  })
)

const domainResourceArb = Arbitrary.make(TestDomainResource)

describe('DomainResource base model', () => {
  test('property: encode-decode cycle', () => {
    fc.assert(
      fc.property(domainResourceArb, (resource) => {
        const encoded = Schema.encodeSync(TestDomainResource)(resource)
        const decoded = Schema.decodeSync(TestDomainResource)(encoded)
        expect(decoded).toEqual(resource)
      })
    )
  })
})
