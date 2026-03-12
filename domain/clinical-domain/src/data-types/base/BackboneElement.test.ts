import * as fc from 'fast-check'
import { describe, expect, expectTypeOf, test } from 'vitest'
import { Arbitrary, Schema } from 'effect'

import { MergeClasses } from '@assessmentis/util'

import { BackboneElement, type BackboneElementEncoded } from './BackboneElement'
import type { Extension } from '../special-purpose/Extension'

const BackboneMixin = BackboneElement('TestBackbone')

class TestBackbone extends MergeClasses<TestBackbone>('TestBackbone')(
  [],
  BackboneMixin
) {}

describe('BackboneElement', () => {
  describe('types', () => {
    test('Type.domainType is the literal domain type string', () => {
      expectTypeOf<
        (typeof TestBackbone)['Type']['domainType']
      >().toEqualTypeOf<'TestBackbone'>()
    })

    test('BackboneElementEncoded extends the Encoded type', () => {
      expectTypeOf<BackboneElementEncoded<'TestBackbone'>>().toExtend<
        typeof TestBackbone.Encoded
      >()
    })

    test('Type.modifierExtension is present', () => {
      expectTypeOf<
        (typeof TestBackbone)['Type']['modifierExtension']
      >().toExtend<ReadonlyArray<Extension>>()
    })
  })

  test('decodes minimal input — domainType, extension, modifierExtension default', () => {
    const decoded = Schema.decodeSync(TestBackbone)({})
    expect(decoded.domainType).toBe('TestBackbone')
    expect(decoded.extension).toEqual([])
    expect(decoded.modifierExtension).toEqual([])
    expect(decoded.url).toBeUndefined()
  })

  test('DomainType static equals the domain type', () => {
    expect(TestBackbone.DomainType).toBe('TestBackbone')
  })

  test('property: encode-decode round-trip', () => {
    const arb = Arbitrary.make(TestBackbone)
    fc.assert(
      fc.property(arb, (element) => {
        const encoded = Schema.encodeSync(TestBackbone)(element)
        const decoded = Schema.decodeSync(TestBackbone)(encoded)
        expect(decoded).toEqual(element)
      })
    )
  })
})
