import { describe, expect, it } from 'vitest'

import { isNotTagged } from './predicates'

type TestUnion =
  | { readonly _tag: 'Alpha'; value: number }
  | { readonly _tag: 'Beta'; value: string }
  | { readonly _tag: 'Gamma' }

describe('isNotTagged', () => {
  it('returns false when the tag matches', () => {
    const val: TestUnion = { _tag: 'Alpha', value: 1 }
    expect(isNotTagged(val, 'Alpha')).toBe(false)
  })

  it('returns true when the tag does not match', () => {
    const val: TestUnion = { _tag: 'Beta', value: 'hello' }
    expect(isNotTagged(val, 'Alpha')).toBe(true)
  })

  describe('curried form', () => {
    it('returns false when the tag matches', () => {
      const val: TestUnion = { _tag: 'Gamma' }
      expect(isNotTagged('Gamma')(val)).toBe(false)
    })

    it('returns true when the tag does not match', () => {
      const val: TestUnion = { _tag: 'Alpha', value: 42 }
      expect(isNotTagged('Gamma')(val)).toBe(true)
    })
  })

  it('narrows the type to Exclude<Union, { _tag: Tag }>', () => {
    const val: TestUnion = { _tag: 'Beta', value: 'hi' }
    if (isNotTagged(val, 'Alpha')) {
      // TypeScript should narrow to Beta | Gamma
      const _narrowed: { readonly _tag: 'Beta' } | { readonly _tag: 'Gamma' } =
        val
      expect(_narrowed).toBeDefined()
    }
  })
})
