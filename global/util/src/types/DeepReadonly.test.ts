import * as fc from 'fast-check'
import { describe, it } from 'vitest'
import { FastCheck } from 'effect'
import { property } from 'effect/FastCheck'

import type { DeepReadonly } from './DeepReadonly'

describe('DeepReadonly', () => {
  it('should exist', () => {
    FastCheck.assert(property(fc.object(), (_) => true))
  })
})

const _readOnlyObjarray: DeepReadonly<{ a: { b: number[] } }[]> = [
  { a: { b: [1, 2, 3] } },
  { a: { b: [4, 5, 6] } },
] as readonly { a: { b: readonly number[] } }[]
