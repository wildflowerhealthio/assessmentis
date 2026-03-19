import { Effect } from 'effect'
import { describe, expect, it } from 'vitest'

import { SideEffect } from './side-effect'

describe('SideEffect', () => {
  describe('of', () => {
    it('creates a SideEffect with the given value and no actions', () => {
      const se = SideEffect.of(42)
      expect(se.value).toBe(42)
      expect(se.actions).toEqual([])
    })

    it('creates a SideEffect with the given value and actions', () => {
      const action = Effect.void
      const se = SideEffect.of('hello', [action])
      expect(se.value).toBe('hello')
      expect(se.actions).toEqual([action])
    })
  })

  describe('map', () => {
    it('transforms the value', () => {
      const se = SideEffect.of(10)
      const mapped = SideEffect.map((n: number) => n * 2)(se)
      expect(mapped.value).toBe(20)
    })

    it('preserves the existing actions', () => {
      const action = Effect.void
      const se = SideEffect.of(10, [action])
      const mapped = SideEffect.map((n: number) => n + 1)(se)
      expect(mapped.actions).toEqual([action])
    })
  })

  describe('flatMap', () => {
    it('transforms the value using the inner SideEffect', () => {
      const se = SideEffect.of(5)
      const result = SideEffect.flatMap((n: number) => SideEffect.of(n.toString()))(se)
      expect(result.value).toBe('5')
    })

    it('concatenates actions from both SideEffects', () => {
      const action1 = Effect.void
      const action2 = Effect.void
      const se = SideEffect.of('a', [action1])
      const result = SideEffect.flatMap((s: string) => SideEffect.of(`${s}b`, [action2]))(se)
      expect(result.value).toBe('ab')
      expect(result.actions).toHaveLength(2)
      expect(result.actions[0]).toBe(action1)
      expect(result.actions[1]).toBe(action2)
    })

    it('preserves original actions when inner has none', () => {
      const action = Effect.void
      const se = SideEffect.of(1, [action])
      const result = SideEffect.flatMap((n: number) => SideEffect.of(n))(se)
      expect(result.actions).toEqual([action])
    })
  })
})
