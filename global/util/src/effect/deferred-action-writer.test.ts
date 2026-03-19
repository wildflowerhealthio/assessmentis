import { Effect } from 'effect'
import { describe, expect, it } from 'vitest'

import { DeferredActionWriter } from './deferred-action-writer'

describe('DeferredActionWriter', () => {
  describe('of', () => {
    it('creates a DeferredActionWriter with the given value and no actions', () => {
      const se = DeferredActionWriter.of(42)
      expect(se.value).toBe(42)
      expect(se.actions).toEqual([])
    })

    it('creates a DeferredActionWriter with the given value and actions', () => {
      const action = Effect.void
      const se = DeferredActionWriter.of('hello', [action])
      expect(se.value).toBe('hello')
      expect(se.actions).toEqual([action])
    })
  })

  describe('map', () => {
    it('transforms the value', () => {
      const se = DeferredActionWriter.of(10)
      const mapped = DeferredActionWriter.map((n: number) => n * 2)(se)
      expect(mapped.value).toBe(20)
    })

    it('preserves the existing actions', () => {
      const action = Effect.void
      const se = DeferredActionWriter.of(10, [action])
      const mapped = DeferredActionWriter.map((n: number) => n + 1)(se)
      expect(mapped.actions).toEqual([action])
    })
  })

  describe('flatMap', () => {
    it('transforms the value using the inner DeferredActionWriter', () => {
      const se = DeferredActionWriter.of(5)
      const result = DeferredActionWriter.flatMap((n: number) =>
        DeferredActionWriter.of(n.toString())
      )(se)
      expect(result.value).toBe('5')
    })

    it('concatenates actions from both DeferredActionWriters', () => {
      const action1 = Effect.void
      const action2 = Effect.void
      const se = DeferredActionWriter.of('a', [action1])
      const result = DeferredActionWriter.flatMap((s: string) =>
        DeferredActionWriter.of(`${s}b`, [action2])
      )(se)
      expect(result.value).toBe('ab')
      expect(result.actions).toHaveLength(2)
      expect(result.actions[0]).toBe(action1)
      expect(result.actions[1]).toBe(action2)
    })

    it('preserves original actions when inner has none', () => {
      const action = Effect.void
      const se = DeferredActionWriter.of(1, [action])
      const result = DeferredActionWriter.flatMap((n: number) => DeferredActionWriter.of(n))(se)
      expect(result.actions).toEqual([action])
    })
  })
})
