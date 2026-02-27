import { expect, test, describe, expectTypeOf } from 'vitest'
import { Resource, type ResourceEncoded } from './Resource'
import { Arbitrary, Schema } from 'effect'
import { MergeClasses } from '@assessmentis/util'
import * as fc from 'fast-check'
import type { Extension } from '../special-purpose/Extension'

const ResourceMixin = Resource('TestResource')

class TestResource extends MergeClasses<TestResource>('TestResource')(
  ResourceMixin
) {}

describe('Resource', () => {
  describe('types', () => {
    test('Type.domainType is the literal domain type string', () => {
      expectTypeOf<
        (typeof TestResource)['Type']['domainType']
      >().toEqualTypeOf<'TestResource'>()
    })

    test('ResourceEncoded extends the Encoded type', () => {
      expectTypeOf<ResourceEncoded<'TestResource'>>().toExtend<
        typeof TestResource.Encoded
      >()
    })

    test('Type has all DomainResource fields', () => {
      type T = (typeof TestResource)['Type']
      expectTypeOf<T['extension']>().toExtend<ReadonlyArray<Extension>>()
      expectTypeOf<T['modifierExtension']>().toExtend<
        ReadonlyArray<Extension>
      >()
      expectTypeOf<T['contained']>().toExtend<ReadonlyArray<unknown>>()
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

  test('Key static equals the domain type', () => {
    expect(TestResource.Key).toBe('TestResource')
  })

  test('property: encode-decode round-trip', () => {
    const arb = Arbitrary.make(TestResource)
    fc.assert(
      fc.property(arb, (resource) => {
        const encoded = Schema.encodeSync(TestResource)(resource)
        const decoded = Schema.decodeSync(TestResource)(encoded)
        expect(decoded).toEqual(resource)
      })
    )
  })
})
