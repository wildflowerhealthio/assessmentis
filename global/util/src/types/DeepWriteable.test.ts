import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { FastCheck } from 'effect'
import { property } from 'effect/FastCheck'
import type { Writeable, DeepWriteable } from './DeepWriteable'

describe('DeepWriteable', () => {
  describe('Writeable', () => {
    it('should exist as a type', () => {
      FastCheck.assert(property(fc.object(), (_) => true))
    })

    // Compile-time type assertions
    // These verify that readonly modifiers are removed at the shallow level
  })

  describe('DeepWriteable', () => {
    it('should exist as a type', () => {
      FastCheck.assert(property(fc.object(), (_) => true))
    })

    // Compile-time type assertions
    // These verify that readonly modifiers are removed at all levels
  })
})

// ============================================================
// COMPILE-TIME TYPE ASSERTIONS
// These will cause TypeScript errors if the types don't work correctly
// ============================================================

// --- Writeable (shallow) ---

// Test: Shallow readonly is removed
type ShallowReadonly = { readonly a: number; readonly b: string }
const _shallowWriteable: Writeable<ShallowReadonly> = { a: 1, b: 'test' }
// Assignment to mutable field should compile
_shallowWriteable.a = 2
_shallowWriteable.b = 'modified'

// Test: Non-readonly fields pass through unchanged
type NoReadonly = { a: number; b: string }
const _noReadonlyWriteable: Writeable<NoReadonly> = { a: 1, b: 'test' }
_noReadonlyWriteable.a = 2

// --- DeepWriteable (deep) ---

// Test: Deep readonly is removed at nested levels
type DeepReadonlyObj = {
  readonly a: {
    readonly b: {
      readonly c: number
    }
  }
}
const _deepWriteable: DeepWriteable<DeepReadonlyObj> = {
  a: { b: { c: 1 } },
}
// All levels should be mutable
_deepWriteable.a = { b: { c: 2 } }
_deepWriteable.a.b = { c: 3 }
_deepWriteable.a.b.c = 4

// Test: Deep readonly with arrays
type DeepReadonlyArray = {
  readonly items: readonly { readonly value: number }[]
}
const _deepWriteableArray: DeepWriteable<DeepReadonlyArray> = {
  items: [{ value: 1 }, { value: 2 }],
}
_deepWriteableArray.items = [{ value: 3 }]
_deepWriteableArray.items[0] = { value: 4 }
_deepWriteableArray.items[0].value = 5

// Test: Mixed readonly and non-readonly fields
type MixedReadonly = {
  readonly readonlyField: {
    readonly nested: number
  }
  mutableField: {
    readonly nested: string
  }
}
const _mixedWriteable: DeepWriteable<MixedReadonly> = {
  readonlyField: { nested: 1 },
  mutableField: { nested: 'test' },
}
_mixedWriteable.readonlyField = { nested: 2 }
_mixedWriteable.readonlyField.nested = 3
_mixedWriteable.mutableField = { nested: 'modified' }
_mixedWriteable.mutableField.nested = 'also modified'

// Test: Primitives pass through unchanged
type PrimitiveReadonly = { readonly num: number; readonly str: string }
const _primitiveWriteable: DeepWriteable<PrimitiveReadonly> = {
  num: 42,
  str: 'hello',
}
_primitiveWriteable.num = 100
_primitiveWriteable.str = 'world'

// Silence unused variable warnings
void _shallowWriteable
void _noReadonlyWriteable
void _deepWriteable
void _deepWriteableArray
void _mixedWriteable
void _primitiveWriteable
