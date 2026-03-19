import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'

import type { Extension } from '../special-purpose/extension'
import { Resource } from './resource'
import type { ResourceEncoded } from './resource'

const TestResourceResource = Resource('TestResource')

class TestResource extends TestResourceResource.extend<TestResource>('TestResource')({}) {
  static readonly DomainType = TestResourceResource.DomainType
  static readonly UrlSchema = TestResourceResource.UrlSchema
}

describe('Resource', () => {
  describe('types', () => {
    test('Type.domainType is the literal domain type string', () => {
      expectTypeOf<(typeof TestResource)['Type']['domainType']>().toEqualTypeOf<'TestResource'>()
    })

    test('ResourceEncoded extends the Encoded type', () => {
      expectTypeOf<ResourceEncoded<'TestResource'>>().toExtend<typeof TestResource.Encoded>()
    })

    test('Type has all Resource fields', () => {
      type T = (typeof TestResource)['Type']
      expectTypeOf<T['extension']>().toExtend<readonly Extension[]>()
      expectTypeOf<T['modifierExtension']>().toExtend<readonly Extension[]>()
      expectTypeOf<T['contained']>().toExtend<readonly unknown[]>()
    })
  })

  test('decodes minimal input — defaults apply', () => {
    const decoded = Schema.decodeSync(TestResource)({})
    expect(decoded.domainType).toBe('TestResource')
    expect(decoded.extension).toEqual([])
    expect(decoded.modifierExtension).toEqual([])
    expect(decoded.contained).toEqual([])
    expect(decoded.url).toBeUndefined()
    expect(decoded.meta).toBeUndefined()
    expect(decoded.text).toBeUndefined()
    expect(decoded.language).toBeUndefined()
    expect(decoded.implicitRules).toBeUndefined()
  })

  test('DomainType static equals the domain type', () => {
    expect(TestResource.DomainType).toBe('TestResource')
  })

  test('property: encode-decode round-trip', () => {
    const arb = Arbitrary.make(TestResource)
    fc.assert(
      fc.property(arb, (resource) => {
        const encoded = Schema.encodeSync(TestResource)(resource)
        const decoded = Schema.decodeSync(TestResource)(encoded)
        expect(decoded).toSchemaEqual(resource)
      })
    )
  })
})
