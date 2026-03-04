import { expect, test, describe, expectTypeOf } from 'vitest'
import { Arbitrary, Schema } from 'effect'
import * as fc from 'fast-check'
import { Element } from './Element'
import { Extension, type ExtensionEncoded } from '../special-purpose/Extension'
import { MergeClasses } from '@assessmentis/util'

// ---------------------------------------------------------------------------
// Element tests
// ---------------------------------------------------------------------------

const ElementMixin = Element('TestElement')

class TestElement extends MergeClasses<TestElement>('TestElement')(
  [],
  ElementMixin
) {}

describe('Element', () => {
  describe('types', () => {
    test('Type.domainType is the literal domain type string', () => {
      expectTypeOf<
        (typeof TestElement)['Type']['domainType']
      >().toEqualTypeOf<'TestElement'>()
    })

    test('Encoded.domainType is optional (defaults on decode)', () => {
      expectTypeOf<typeof TestElement.Encoded.domainType>().toEqualTypeOf<
        'TestElement' | undefined
      >()
    })

    test('Type.extension items are Extension<V> — carries value types', () => {
      type ExtItem = (typeof TestElement.Type.extension)[number]
      expectTypeOf<ExtItem>().toExtend<Extension>()
    })

    test('Encoded.extension items are ExtensionEncoded<V>', () => {
      type EncExt = NonNullable<typeof TestElement.Encoded.extension>
      type EncExtItem = EncExt extends ReadonlyArray<infer T> ? T : never
      expectTypeOf<EncExtItem>().toExtend<ExtensionEncoded>()
    })
  })

  test('decodes minimal input — domainType and extension default', () => {
    const decoded = Schema.decodeSync(TestElement)({})
    expect(decoded.domainType).toBe('TestElement')
    expect(decoded.extension).toEqual([])
    expect(decoded.url).toBeUndefined()
  })

  test('domainType literal is accessible on the Element result', () => {
    expect(TestElement.DomainType).toBe('TestElement')
  })

  test('property: encode-decode round-trip', () => {
    const arb = Arbitrary.make(TestElement)
    fc.assert(
      fc.property(arb, (element) => {
        const encoded = Schema.encodeSync(TestElement)(element)
        const decoded = Schema.decodeSync(TestElement)(encoded)
        expect(decoded).toEqual(element)
      })
    )
  })
})
