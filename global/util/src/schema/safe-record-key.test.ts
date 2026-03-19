import { Arbitrary, Schema, FastCheck as fc } from 'effect'
import { describe, expect, test } from 'vitest'

import { DANGEROUS_KEYS, SafeRecordKey } from './safe-record-key'

describe('SafeRecordKey', () => {
  const decode = Schema.decodeUnknownSync(SafeRecordKey)
  const decodeEither = Schema.decodeUnknownEither(SafeRecordKey)

  test('accepts normal strings', () => {
    expect(decode('hello')).toBe('hello')
    expect(decode('my-key')).toBe('my-key')
    expect(decode('')).toBe('')
  })

  test.each([...DANGEROUS_KEYS])('rejects dangerous key: %s', (key) => {
    const result = decodeEither(key)
    expect(result._tag).toBe('Left')
  })

  test('property: round-trip preserves value', () => {
    const arb = Arbitrary.make(SafeRecordKey)
    fc.assert(
      fc.property(arb, (key) => {
        const encoded = Schema.encodeSync(SafeRecordKey)(key)
        const decoded = decode(encoded)
        expect(decoded).toBe(key)
      })
    )
  })

  test('property: arbitrary never generates dangerous keys', () => {
    const arb = Arbitrary.make(SafeRecordKey)
    fc.assert(
      fc.property(arb, (key) => {
        expect(DANGEROUS_KEYS.has(key)).toBe(false)
      })
    )
  })
})
