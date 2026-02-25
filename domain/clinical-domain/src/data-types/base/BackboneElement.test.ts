import { expect, test, describe, expectTypeOf } from 'vitest'
import { BackboneElement, type BackboneElementEncoded } from './BackboneElement'
import { Arbitrary, Schema } from 'effect'
import { applySchemaMixinTo } from '@assessmentis/util'
import * as fc from 'fast-check'

const BackboneMixin = BackboneElement('TestBackbone')

class TestBackbonePreMix extends Schema.Class<TestBackbonePreMix>(
  'TestBackbone'
)({
  ...BackboneMixin.fields,
}) {}

const TestBackbone = applySchemaMixinTo(TestBackbonePreMix, BackboneMixin)
type TestBackbone = TestBackbonePreMix

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
      >().toExtend<ReadonlyArray<any>>()
    })
  })

  test('decodes minimal input — domainType, extension, modifierExtension default', () => {
    const decoded = Schema.decodeSync(TestBackbone)({})
    expect(decoded.domainType).toBe('TestBackbone')
    expect(decoded.extension).toEqual([])
    expect(decoded.modifierExtension).toEqual([])
    expect(decoded.url).toBeUndefined()
  })

  test('Key static equals the domain type', () => {
    expect(TestBackbone.Key).toBe('TestBackbone')
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
