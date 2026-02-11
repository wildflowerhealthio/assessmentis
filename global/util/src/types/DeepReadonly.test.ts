import { describe, it } from 'vitest'
import { FastCheck } from 'effect'
import type { DeepReadonly } from './DeepReadonly'
import { property } from 'effect/FastCheck'
import * as fc from 'fast-check'

describe('DeepReadonly', () => {
  it('should exist', () => {
    FastCheck.assert(property(fc.object(), (_) => true))
  })
})

const _readOnlyObjarray: DeepReadonly<{ a: { b: number[] } }[]> = [
  { a: { b: [1, 2, 3] } },
  { a: { b: [4, 5, 6] } },
] as readonly { a: { b: readonly number[] } }[]
