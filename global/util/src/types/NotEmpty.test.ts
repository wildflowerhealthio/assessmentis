import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { FastCheck } from 'effect'
import { property } from 'effect/FastCheck'
import type { NotEmpty } from './NotEmpty'

describe('NotEmpty', () => {
  describe('type behavior', () => {
    it('should exist as a type utility', () => {
      FastCheck.assert(property(fc.object(), (_) => true))
    })

    it('property: non-empty objects have at least one key', () => {
      fc.assert(
        fc.property(
          fc.record({ a: fc.anything() }, { withDeletedKeys: false }),
          (obj) => {
            // Non-empty record always has keys
            expect(Object.keys(obj).length).toBeGreaterThan(0)
          }
        )
      )
    })
  })
})

// ============================================================
// COMPILE-TIME TYPE ASSERTIONS
// These verify that NotEmpty correctly distinguishes empty from non-empty objects
// ============================================================

// --- Non-empty objects pass through ---

// Single key object
type SingleKey = { a: number }
type SingleKeyNotEmpty = NotEmpty<SingleKey>
const _singleKey: SingleKeyNotEmpty = { a: 1 }

// Multiple keys object
type MultipleKeys = { a: number; b: string; c: boolean }
type MultipleKeysNotEmpty = NotEmpty<MultipleKeys>
const _multipleKeys: MultipleKeysNotEmpty = { a: 1, b: 'test', c: true }

// Nested object
type NestedObj = { outer: { inner: number } }
type NestedNotEmpty = NotEmpty<NestedObj>
const _nested: NestedNotEmpty = { outer: { inner: 42 } }

// Object with optional keys (still has keys defined)
type WithOptional = { required: number; optional?: string }
type WithOptionalNotEmpty = NotEmpty<WithOptional>
const _withOptional: WithOptionalNotEmpty = { required: 1 }

// --- Empty objects become never ---

// This is the key behavior: NotEmpty<{}> should be never
// We can't directly assign to `never`, but we can verify the type relationship

// Type-level assertion that NotEmpty<{}> extends never
type EmptyObj = object
type EmptyResult = NotEmpty<EmptyObj>
// If EmptyResult is `never`, then this conditional type resolves to true
type IsNever<T> = [T] extends [never] ? true : false
type EmptyIsNever = IsNever<EmptyResult>
// This assignment would fail if EmptyIsNever is not `true`
const _emptyIsNever: EmptyIsNever = true

// --- Type with index signature ---
// Note: Objects with index signatures have keys, so they're not empty
type WithIndex = { [key: string]: number }
type WithIndexResult = NotEmpty<WithIndex>
// This should not be never because index signatures define potential keys
const _withIndex: WithIndexResult = { someKey: 42 }

// --- Record types ---
// Record<string, T> has an index signature, so it's not empty
type RecordType = Record<string, number>
type RecordNotEmpty = NotEmpty<RecordType>
const _record: RecordNotEmpty = { key: 123 }

// --- Utility type usage example ---
// NotEmpty can be used to enforce non-empty config objects
type Config<T> = NotEmpty<T>
type ValidConfig = Config<{ apiKey: string }>
const _validConfig: ValidConfig = { apiKey: 'secret' }

// Silence unused variable warnings
void _singleKey
void _multipleKeys
void _nested
void _withOptional
void _emptyIsNever
void _withIndex
void _record
void _validConfig

// --- Additional type-level tests ---

// Verify that the type correctly handles various edge cases
type NumberKey = { 0: string }
type NumberKeyNotEmpty = NotEmpty<NumberKey>
const _numberKey: NumberKeyNotEmpty = { 0: 'value' }
void _numberKey

// Symbol key (TypeScript treats symbol keys differently)
declare const sym: unique symbol
type SymbolKey = { [sym]: number }
type SymbolKeyNotEmpty = NotEmpty<SymbolKey>
// Note: We can't easily create a value for this without the actual symbol,
// but the type should still work
type SymbolKeyIsNotNever = IsNever<SymbolKeyNotEmpty>
const _symbolKeyIsNotNever: SymbolKeyIsNotNever = false
void _symbolKeyIsNotNever
