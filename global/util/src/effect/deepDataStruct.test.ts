import { describe, expect, it } from 'vitest'
import { Equal } from 'effect'

import { deepDataStruct } from './deepDataStruct'

describe('deepDataStruct', () => {
  it('wraps a flat object so Equal.equals works', () => {
    const a = deepDataStruct({ tag: 'x', value: 42 })
    const b = deepDataStruct({ tag: 'x', value: 42 })
    expect(Equal.equals(a, b)).toBe(true)
  })

  it('detects differences in flat objects', () => {
    const a = deepDataStruct({ tag: 'x', value: 42 })
    const b = deepDataStruct({ tag: 'x', value: 99 })
    expect(Equal.equals(a, b)).toBe(false)
  })

  it('wraps nested objects recursively', () => {
    const a = deepDataStruct({ tag: 'x', nested: { flag: true } })
    const b = deepDataStruct({ tag: 'x', nested: { flag: true } })
    expect(Equal.equals(a, b)).toBe(true)
  })

  it('detects differences in nested objects', () => {
    const a = deepDataStruct({ tag: 'x', nested: { flag: true } })
    const b = deepDataStruct({ tag: 'x', nested: { flag: false } })
    expect(Equal.equals(a, b)).toBe(false)
  })

  it('handles deeply nested structures', () => {
    const a = deepDataStruct({ a: { b: { c: { d: 'deep' } } } })
    const b = deepDataStruct({ a: { b: { c: { d: 'deep' } } } })
    expect(Equal.equals(a, b)).toBe(true)
  })

  it('preserves primitive values without wrapping', () => {
    const a = deepDataStruct({ str: 'hello', num: 1, bool: true })
    const b = deepDataStruct({ str: 'hello', num: 1, bool: true })
    expect(Equal.equals(a, b)).toBe(true)
  })

  it('wraps arrays so Equal.equals works', () => {
    const a = deepDataStruct({ items: [1, 2, 3] })
    const b = deepDataStruct({ items: [1, 2, 3] })
    expect(Equal.equals(a, b)).toBe(true)
  })

  it('detects differences in arrays', () => {
    const a = deepDataStruct({ items: [1, 2, 3] })
    const b = deepDataStruct({ items: [1, 2, 99] })
    expect(Equal.equals(a, b)).toBe(false)
  })

  it('wraps plain objects inside arrays recursively', () => {
    const a = deepDataStruct({ items: [{ x: 1 }, { x: 2 }] })
    const b = deepDataStruct({ items: [{ x: 1 }, { x: 2 }] })
    expect(Equal.equals(a, b)).toBe(true)
  })

  it('detects differences in objects inside arrays', () => {
    const a = deepDataStruct({ items: [{ x: 1 }] })
    const b = deepDataStruct({ items: [{ x: 2 }] })
    expect(Equal.equals(a, b)).toBe(false)
  })

  it('handles nested arrays', () => {
    const a = deepDataStruct({
      matrix: [
        [1, 2],
        [3, 4],
      ],
    })
    const b = deepDataStruct({
      matrix: [
        [1, 2],
        [3, 4],
      ],
    })
    expect(Equal.equals(a, b)).toBe(true)
  })

  it('handles undefined values', () => {
    const a = deepDataStruct({ tag: 'x', extra: undefined })
    const b = deepDataStruct({ tag: 'x', extra: undefined })
    expect(Equal.equals(a, b)).toBe(true)
  })
})
