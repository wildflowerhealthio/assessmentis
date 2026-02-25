import { describe, expect, expectTypeOf, it } from 'vitest'
import { Schema } from 'effect'
import { applySchemaMixinTo } from './MixinableFields'

class MixinClass extends Schema.Class<MixinClass>('MixinClass')({
  aField: Schema.Literal('aField'),
}) {
  static staticA = 'staticA' as const
  aMethod() {
    return 'aMethod' as const
  }
}

class BaseClass extends Schema.Class<BaseClass>('BaseClass')({
  ...MixinClass.fields,
  bField: Schema.Literal('bField'),
}) {
  static staticB = 'staticB' as const
  bMethod() {
    return 'bMethod' as const
  }
}

const Mixed = applySchemaMixinTo<typeof BaseClass, typeof MixinClass>(
  BaseClass,
  MixinClass
)

describe('applySchemaMixinTo', () => {
  describe('static members', () => {
    it('adds static properties from the mixin', () => {
      expect(Mixed.staticA).toBe('staticA')
    })

    it('preserves static properties from the base class', () => {
      expect(Mixed.staticB).toBe('staticB')
    })

    it('types mixin statics correctly', () => {
      expectTypeOf(Mixed.staticA).toEqualTypeOf<'staticA'>()
    })

    it('types base statics correctly', () => {
      expectTypeOf(Mixed.staticB).toEqualTypeOf<'staticB'>()
    })
  })

  describe('instance via constructor', () => {
    const instance = new Mixed({ aField: 'aField', bField: 'bField' })

    it('adds mixin instance methods', () => {
      expect(instance.aMethod()).toBe('aMethod')
    })

    it('preserves base instance methods', () => {
      expect(instance.bMethod()).toBe('bMethod')
    })

    it('preserves field values', () => {
      expect(instance.aField).toBe('aField')
      expect(instance.bField).toBe('bField')
    })

    it('types instances with both base and mixin members', () => {
      expectTypeOf(instance.aMethod).toBeFunction()
      expectTypeOf(instance.bMethod).toBeFunction()
      expectTypeOf(instance.aField).toEqualTypeOf<'aField'>()
      expectTypeOf(instance.bField).toEqualTypeOf<'bField'>()
    })
  })

  describe('instance via make()', () => {
    const instance = Mixed.make({ aField: 'aField', bField: 'bField' })

    it('adds mixin instance methods', () => {
      expect(instance.aMethod()).toBe('aMethod')
    })

    it('preserves base instance methods', () => {
      expect(instance.bMethod()).toBe('bMethod')
    })

    it('preserves field values', () => {
      expect(instance.aField).toBe('aField')
      expect(instance.bField).toBe('bField')
    })

    it('types make() return with both base and mixin members', () => {
      expectTypeOf(instance.aMethod).toBeFunction()
      expectTypeOf(instance.bMethod).toBeFunction()
      expectTypeOf(instance.aField).toEqualTypeOf<'aField'>()
      expectTypeOf(instance.bField).toEqualTypeOf<'bField'>()
    })
  })

  describe('fields', () => {
    it('retains all fields on the base class', () => {
      expect(Mixed.fields).toHaveProperty('aField')
      expect(Mixed.fields).toHaveProperty('bField')
    })
  })
})
